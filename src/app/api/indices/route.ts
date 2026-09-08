import { NextRequest, NextResponse } from 'next/server';
import { MarketIndexData, MarketIndexPoint, InvestorTrend } from '@/lib/types';

interface CachedData {
  indices: Record<string, MarketIndexData>;
  investorTrends: Record<string, InvestorTrend>;
  timestamp: number;
}

let cachedPayload: CachedData | null = null;
const CACHE_TTL_MS = 10_000;

function parseNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).replace(/,/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

async function fetchIndexData(code: 'KOSPI' | 'KOSDAQ' | 'FUT'): Promise<MarketIndexData | null> {
  try {
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: 'https://m.stock.naver.com/',
    };

    // 1. Basic/realtime info
    let basicUrl = `https://m.stock.naver.com/api/index/${code}/basic`;
    // 2. Day intraday chart
    let chartUrl = `https://api.stock.naver.com/chart/domestic/index/${code}?periodType=day`;

    const [basicRes, chartRes] = await Promise.all([
      fetch(basicUrl, { headers, next: { revalidate: 10 } }),
      fetch(chartUrl, { headers, next: { revalidate: 10 } }),
    ]);

    if (!basicRes.ok) {
      console.error(`Failed to fetch index basic for ${code}: ${basicRes.status}`);
      return null;
    }

    const basicJson = await basicRes.json();

    const name =
      code === 'KOSPI'
        ? '코스피'
        : code === 'KOSDAQ'
        ? '코스닥'
        : '코스피200 선물';

    const nowPrice = parseNumber(basicJson.nowPrc || basicJson.closePrice);

    // Compare
    const isFalling =
      basicJson.compareToPreviousPrice?.name === 'FALLING' ||
      basicJson.compareToPreviousPrice?.name === 'LOWER_LIMIT' ||
      String(basicJson.compareToPreviousClosePrice).startsWith('-');

    let diffPrice = parseNumber(basicJson.compareToPreviousClosePrice);
    if (isFalling && diffPrice > 0) diffPrice = -diffPrice;

    let diffRate = parseNumber(basicJson.fluctuationsRatio);
    if (isFalling && diffRate > 0) diffRate = -diffRate;

    const openPrice = parseNumber(basicJson.openPrice || basicJson.openPrc);
    const highPrice = parseNumber(basicJson.highPrice || basicJson.highPrc);
    const lowPrice = parseNumber(basicJson.lowPrice || basicJson.lowPrc);

    // Parse intraday points
    const chartPoints: MarketIndexPoint[] = [];
    if (chartRes.ok) {
      const chartJson = await chartRes.json();
      const rawPoints = chartJson.priceInfos || [];
      rawPoints.forEach((pt: any) => {
        const rawTime = String(pt.localDateTime || '');
        // format HH:mm from YYYYMMDDHHmmss
        const timeStr =
          rawTime.length >= 12
            ? `${rawTime.substring(8, 10)}:${rawTime.substring(10, 12)}`
            : rawTime;
        const price = parseNumber(pt.currentPrice || pt.closePrice);
        if (price > 0) {
          chartPoints.push({ time: timeStr, price });
        }
      });
    }

    return {
      code,
      name,
      nowPrice,
      diffPrice,
      diffRate,
      openPrice,
      highPrice,
      lowPrice,
      chartPoints,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`Error fetching index ${code}:`, err);
    return null;
  }
}

async function fetchInvestorTrend(code: 'KOSPI' | 'KOSDAQ' | 'FUT'): Promise<InvestorTrend | null> {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Referer: 'https://m.stock.naver.com/',
    };

    const url = `https://m.stock.naver.com/api/index/${code}/trend`;
    const res = await fetch(url, { headers, next: { revalidate: 10 } });
    if (!res.ok) return null;

    const data = await res.json();
    const marketName =
      code === 'KOSPI'
        ? '코스피'
        : code === 'KOSDAQ'
        ? '코스닥'
        : '코스피200 선물';

    const unit = code === 'FUT' ? '계약' : '억원';

    return {
      code,
      marketName,
      unit,
      personal: parseNumber(data.personalValue),
      foreign: parseNumber(data.foreignValue),
      institutional: parseNumber(data.institutionalValue),
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`Error fetching trend ${code}:`, err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const now = Date.now();
  if (cachedPayload && now - cachedPayload.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...cachedPayload.indices,
      indices: cachedPayload.indices,
      investorTrends: cachedPayload.investorTrends,
    });
  }

  const [kospi, kosdaq, fut, kospiTrend, kosdaqTrend, futTrend] = await Promise.all([
    fetchIndexData('KOSPI'),
    fetchIndexData('KOSDAQ'),
    fetchIndexData('FUT'),
    fetchInvestorTrend('KOSPI'),
    fetchInvestorTrend('KOSDAQ'),
    fetchInvestorTrend('FUT'),
  ]);

  const indices: Record<string, MarketIndexData> = {};
  if (kospi) indices['KOSPI'] = kospi;
  if (kosdaq) indices['KOSDAQ'] = kosdaq;
  if (fut) indices['FUT'] = fut;

  const investorTrends: Record<string, InvestorTrend> = {};
  if (kospiTrend) investorTrends['KOSPI'] = kospiTrend;
  if (kosdaqTrend) investorTrends['KOSDAQ'] = kosdaqTrend;
  if (futTrend) investorTrends['FUT'] = futTrend;

  cachedPayload = {
    indices,
    investorTrends,
    timestamp: now,
  };

  return NextResponse.json(
    {
      ...indices, // backward compatibility
      indices,
      investorTrends,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    }
  );
}
