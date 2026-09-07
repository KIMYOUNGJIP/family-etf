import { CalculatedAccount, PortfolioSummary } from './types';

export function formatTelegramReport(
  summary: PortfolioSummary,
  accounts: CalculatedAccount[],
  titlePrefix = '📊 [가족 ETF 일일 결산 리포트]'
): string {
  const dateStr = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  const formatKRW = (num: number) => {
    const sign = num > 0 ? '+' : '';
    return `${sign}${num.toLocaleString('ko-KR')}원`;
  };

  const formatRate = (rate: number) => {
    const sign = rate > 0 ? '+' : '';
    return `${sign}${rate.toFixed(2)}%`;
  };

  const daySign = summary.dayProfit >= 0 ? '🔺' : '🔻';
  const totalSign = summary.totalProfit >= 0 ? '🟢' : '🔴';

  let msg = `<b>${titlePrefix}</b>\n`;
  msg += `📅 <i>${dateStr}</i>\n\n`;

  msg += `<b>🏛️ 가족 전체 통합 요약</b>\n`;
  msg += `• <b>총 순자산:</b> <b>${summary.totalAsset.toLocaleString('ko-KR')}원</b>\n`;
  msg += `• <b>총 매입금액:</b> ${summary.totalBuy.toLocaleString('ko-KR')}원\n`;
  msg += `• <b>총 주식평가:</b> ${summary.totalEval.toLocaleString('ko-KR')}원\n`;
  msg += `• <b>누적 평가손익:</b> ${totalSign} <b>${formatKRW(summary.totalProfit)} (${formatRate(summary.returnRate)})</b>\n`;
  msg += `• <b>당일 변동손익:</b> ${daySign} ${formatKRW(summary.dayProfit)} (${formatRate(summary.dayProfitRate)})\n`;
  if (summary.totalCash > 0) {
    msg += `• <b>확인 예수금:</b> ${summary.totalCash.toLocaleString('ko-KR')}원\n`;
  }
  msg += `\n━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Accounts
  accounts.forEach((acc) => {
    const accTotalSign = acc.totalProfit >= 0 ? '🟢' : '🔴';
    const accDaySign = acc.dayProfit >= 0 ? '🔺' : '🔻';

    msg += `<b>👤 ${acc.owner} (${acc.nickname})</b>\n`;
    msg += `• 순자산: <b>${acc.totalAsset.toLocaleString('ko-KR')}원</b> (비중 ${acc.totalWeight.toFixed(1)}%)\n`;
    msg += `• 누적손익: ${accTotalSign} ${formatKRW(acc.totalProfit)} (${formatRate(acc.returnRate)})\n`;
    msg += `• 당일손익: ${accDaySign} ${formatKRW(acc.dayProfit)}\n`;

    if (acc.cash > 0) {
      msg += `• 예수금: ${acc.cash.toLocaleString('ko-KR')}원\n`;
    }

    msg += `• <b>보유 종목:</b>\n`;
    acc.holdings.forEach((h) => {
      const hSign = h.evalProfit >= 0 ? '🔺' : '🔻';
      const dayHSign = h.diffPrice >= 0 ? '+' : '';
      msg += `  - <b>${h.name}</b> (${h.quantity}주)\n`;
      msg += `    현재가: ${h.nowPrice.toLocaleString('ko-KR')}원 (${dayHSign}${h.diffRate.toFixed(2)}%)\n`;
      msg += `    평가손익: ${hSign} ${formatKRW(h.evalProfit)} (${formatRate(h.returnRate)})\n`;
    });

    msg += `\n`;
  });

  msg += `<i>※ 네이버 증권 실시간 시세 기준 자동 생성</i>`;
  return msg;
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanToken = botToken.trim();
    const cleanChatId = chatId.trim();

    if (!cleanToken || !cleanChatId) {
      return { success: false, error: '봇 토큰 또는 Chat ID가 입력되지 않았습니다.' };
    }

    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return {
        success: false,
        error: data.description || `HTTP ${res.status}: 메시지 전송 실패`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || '알 수 없는 네트워크 오류' };
  }
}
