import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, formatTelegramReport } from '@/lib/telegram';
import { CalculatedAccount, PortfolioSummary } from '@/lib/types';
import defaultPortfolio from '@/data/default-portfolio.json';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botToken, chatId, summary, accounts, isTest } = body;

    const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
    const targetChatId = chatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !targetChatId) {
      return NextResponse.json(
        {
          success: false,
          error: '텔레그램 봇 토큰(Bot Token)과 Chat ID가 설정되지 않았습니다.',
        },
        { status: 400 }
      );
    }

    if (!summary || !accounts) {
      return NextResponse.json(
        { success: false, error: '요약 데이터 또는 계좌 목록이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    const titlePrefix = isTest
      ? '🔔 [텔레그램 테스트 알림] 가족 ETF 대시보드'
      : '📊 [가족 ETF 일일 결산 리포트]';

    const message = formatTelegramReport(
      summary as PortfolioSummary,
      accounts as CalculatedAccount[],
      titlePrefix
    );

    const result = await sendTelegramMessage(token, targetChatId, message);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: '알림이 성공적으로 전송되었습니다.' });
  } catch (err: any) {
    console.error('Error in alert API:', err);
    return NextResponse.json(
      { success: false, error: err.message || '서버 내부 오류' },
      { status: 500 }
    );
  }
}

// Handler for Vercel Cron (GET request)
export async function GET(request: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json(
        { success: false, error: '서버 환경변수 TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHAT_ID 미설정' },
        { status: 400 }
      );
    }

    // Extract all unique codes
    const codes = Array.from(
      new Set(
        defaultPortfolio.accounts.flatMap((acc) => acc.holdings.map((h) => h.code))
      )
    );

    // Fetch quotes internally
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    const quotesRes = await fetch(
      `${protocol}://${host}/api/quotes?codes=${codes.join(',')}`
    );
    const quotes = await quotesRes.json();

    // Calculate totals
    let totalBuy = 0;
    let totalEval = 0;
    let dayProfit = 0;
    let totalCash = 0;

    const calculatedAccounts: CalculatedAccount[] = defaultPortfolio.accounts.map(
      (acc: any) => {
        let accBuy = 0;
        let accEval = 0;
        let accDayProfit = 0;

        const calculatedHoldings = acc.holdings.map((h: any) => {
          const q = quotes[h.code] || {
            nowPrice: h.avgPrice,
            diffPrice: 0,
            diffRate: 0,
            prevClose: h.avgPrice,
          };

          const buyAmount = h.quantity * h.avgPrice;
          const evalAmount = h.quantity * q.nowPrice;
          const evalProfit = evalAmount - buyAmount;
          const returnRate = buyAmount > 0 ? (evalProfit / buyAmount) * 100 : 0;
          const dayChangeAmount = h.quantity * q.diffPrice;

          accBuy += buyAmount;
          accEval += evalAmount;
          accDayProfit += dayChangeAmount;

          return {
            ...h,
            nowPrice: q.nowPrice,
            diffPrice: q.diffPrice,
            diffRate: q.diffRate,
            prevClose: q.prevClose,
            buyAmount,
            evalAmount,
            evalProfit,
            returnRate,
            dayChangeAmount,
            accountWeight: 0,
            totalWeight: 0,
          };
        });

        const accProfit = accEval - accBuy;
        const accReturnRate = accBuy > 0 ? (accProfit / accBuy) * 100 : 0;
        const totalAsset = accEval + (acc.cash || 0);

        totalBuy += accBuy;
        totalEval += accEval;
        dayProfit += accDayProfit;
        totalCash += acc.cash || 0;

        return {
          id: acc.id,
          owner: acc.owner,
          nickname: acc.nickname,
          color: acc.color,
          cash: acc.cash || 0,
          totalBuy: accBuy,
          totalEval: accEval,
          totalProfit: accProfit,
          returnRate: accReturnRate,
          dayProfit: accDayProfit,
          totalAsset,
          totalWeight: 0,
          holdings: calculatedHoldings,
        };
      }
    );

    const totalProfit = totalEval - totalBuy;
    const returnRate = totalBuy > 0 ? (totalProfit / totalBuy) * 100 : 0;
    const totalAsset = totalEval + totalCash;
    const dayProfitRate =
      totalAsset - dayProfit > 0 ? (dayProfit / (totalAsset - dayProfit)) * 100 : 0;

    const summary: PortfolioSummary = {
      totalBuy,
      totalEval,
      totalProfit,
      returnRate,
      dayProfit,
      dayProfitRate,
      totalCash,
      totalAsset,
      accountCount: calculatedAccounts.length,
      holdingsCount: defaultPortfolio.accounts.reduce(
        (sum, a) => sum + a.holdings.length,
        0
      ),
      updatedAt: new Date().toISOString(),
    };

    const message = formatTelegramReport(
      summary,
      calculatedAccounts,
      '📊 [정기 장마감 리포트] 가족 ETF 포트폴리오'
    );

    const result = await sendTelegramMessage(token, chatId, message);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
