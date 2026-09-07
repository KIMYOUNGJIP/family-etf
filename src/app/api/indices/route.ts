import { NextRequest, NextResponse } from 'next/server';
import { MarketIndexData, MarketIndexPoint } from '@/lib/types';

// Simple in-memory cache
let cachedIndices: { data: Record<string, MarketIndexData>; timestamp: number } | null = null;
const CACHE_TTL_MS = 10_000;

function parseNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).replace(/,/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

async function fetchIndexData(code: 'KOSPI' | 'KOSDAQ'): Promise<MarketIndexData | null> {
  try {
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: 'https://m.stock.naver.com/',
    };

    // 1. Basic / Realtime info
    const realtimeUrl = `https://polling.finance.naver.com/api/realtime/domestic/index/${code}`;
    // 2. Day intraday chart
    const chartUrl = `https://api.stock.naver.com/chart/domestic/index/${code}?periodType=day`;

    const [realtimeRes, chartRes] = await Promise.all([
      fetch(realtimeUrl, { headers, next: { revalidate: 10 } }),
      fetch(chartUrl, { headers, next: { revalidate: 10 } }),
    ]);

    if (!realtimeRes.ok) {
      console.error(`Failed to fetch index realtime for ${code}: ${realtimeRes.status}`);
      return null;
    }

    const realtimeJson = await realtimeRes.json();
    const item = realtimeJson.datas?.[0] || {};

    const name = code === 'KOSPI' ? '코스피' : '코스닥';
    const nowPrice = parseNumber(item.closePriceRaw || item.closePrice);
    
    // Compare
    const isFalling =
      item.compareToPreviousPrice?.name === 'FALLING' ||
      item.compareToPreviousPrice?.name === 'LOWER_LIMIT' ||
      String(item.compareToPreviousClosePriceRaw || item.compareToPreviousClosePrice).startsWith('-');

    let diffPrice = parseNumber(item.compareToPreviousClosePriceRaw || item.compareToPreviousClosePrice);
    if (isFalling && diffPrice > 0) diffPrice = -diffPrice;

    let diffRate = parseNumber(item.fluctuationsRatioRaw || item.fluctuationsRatio);
    if (isFalling && diffRate > 0) diffRate = -diffRate;

    const openPrice = parseNumber(item.openPriceRaw || item.openPrice);
    const highPrice = parseNumber(item.highPriceRaw || item.highPrice);
    const lowPrice = parseNumber(item.lowPriceRaw || item.lowPrice);

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

export async function GET(request: NextRequest) {
  const now = Date.now();
  if (cachedIndices && now - cachedIndices.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedIndices.data);
  }

  const [kospi, kosdaq] = await Promise.all([
    fetchIndexData('KOSPI'),
    fetchIndexData('KOSDAQ'),
  ]);

  const data: Record<string, MarketIndexData> = {};
  if (kospi) data['KOSPI'] = kospi;
  if (kosdaq) data['KOSDAQ'] = kosdaq;

  cachedIndices = { data, timestamp: now };

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
    },
  });
}
