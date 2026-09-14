import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CALENDAR_URL =
  'https://calendar.google.com/calendar/ical/rd8us2ulpclcik4jgdnq8mqb4c%40group.calendar.google.com/private-ba959c81e63b8d564be9574e771695ff/basic.ics';

let cachedIcs: string | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60_000;

export async function GET(request: NextRequest) {
  const now = Date.now();
  if (cachedIcs && now - lastFetchTime < CACHE_TTL_MS) {
    return new NextResponse(cachedIcs, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  }

  try {
    const res = await fetch(GOOGLE_CALENDAR_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error('Google Calendar response failed: ' + res.status);
    }

    const icsText = await res.text();
    cachedIcs = icsText;
    lastFetchTime = now;

    return new NextResponse(icsText, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (err: any) {
    if (cachedIcs) {
      return new NextResponse(cachedIcs, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    return NextResponse.json(
      { error: err.message || 'Failed to fetch calendar' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
