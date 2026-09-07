import { NextRequest, NextResponse } from 'next/server';
import { StockQuote } from '@/lib/types';

// Simple in-memory cache to prevent Naver rate limits (10 seconds)
const cache: Record<string, { quote: StockQuote; timestamp: number }> = {};
const CACHE_TTL_MS = 10_000;

function parseNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).replace(/,/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

async function fetchNaverQuote(code: string): Promise<StockQuote | null> {
  const cleanCode = code.trim().toUpperCase();
  const now = Date.now();

  // Return cached if fresh
  if (cache[cleanCode] && now - cache[cleanCode].timestamp < CACHE_TTL_MS) {
    return cache[cleanCode].quote;
  }

  try {
    const url = `https://m.stock.naver.com/api/stock/${cleanCode}/basic`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://m.stock.naver.com/',
      },
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      console.error(`Failed to fetch ${cleanCode}: HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();

    const stockName = data.stockName || cleanCode;
    const nowPrcStr = data.nowPrc || data.closePrice || '0';
    const nowPrice = parseNumber(nowPrcStr);

    // Naver compareToPreviousPrice: { code: '2', text: '상승', name: 'RISING' } or 'FALLING'
    const compareObj = data.compareToPreviousPrice || {};
    const isFalling =
      compareObj.name === 'FALLING' ||
      compareObj.name === 'LOWER_LIMIT' ||
      String(data.compareToPreviousClosePrice).startsWith('-');

    let diffPrice = parseNumber(data.compareToPreviousClosePrice);
    if (isFalling && diffPrice > 0) {
      diffPrice = -diffPrice;
    }

    let diffRate = parseNumber(data.fluctuationsRatio);
    if (isFalling && diffRate > 0) {
      diffRate = -diffRate;
    }

    const highPrice = parseNumber(data.highPrc);
    const lowPrice = parseNumber(data.lowPrc);
    const openPrice = parseNumber(data.openPrc);
    const volume = parseNumber(data.volume);
    const prevClose = nowPrice - diffPrice;

    const quote: StockQuote = {
      code: cleanCode,
      name: stockName,
      nowPrice,
      diffPrice,
      diffRate,
      highPrice,
      lowPrice,
      openPrice,
      prevClose,
      volume,
      updatedAt: new Date().toISOString(),
    };

    // Update cache
    cache[cleanCode] = { quote, timestamp: now };
    return quote;
  } catch (err) {
    console.error(`Error fetching quote for ${cleanCode}:`, err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codesParam = searchParams.get('codes');

  if (!codesParam) {
    return NextResponse.json(
      { error: 'Query parameter "codes" is required (e.g. ?codes=0167A0,442580)' },
      { status: 400 }
    );
  }

  const codes = codesParam
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  const results = await Promise.all(codes.map((code) => fetchNaverQuote(code)));

  const quotesMap: Record<string, StockQuote> = {};
  results.forEach((q) => {
    if (q) {
      quotesMap[q.code] = q;
    }
  });

  return NextResponse.json(quotesMap, {
    headers: {
      'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
    },
  });
}
