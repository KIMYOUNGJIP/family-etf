export type MarketStatusType = 'OPEN' | 'CLOSED' | 'WEEKEND' | 'PRE_MARKET';

export interface MarketStatus {
  status: MarketStatusType;
  message: string;
  badgeColor: string;
  isRegularTrading: boolean;
  formattedTime: string;
}

export function getMarketStatus(dateInput: Date = new Date()): MarketStatus {
  // Convert current time to KST (UTC+9)
  const utc = dateInput.getTime() + (dateInput.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (3600000 * 9));

  const dayOfWeek = kst.getDay(); // 0: Sun, 6: Sat
  const hours = kst.getHours();
  const minutes = kst.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(kst.getSeconds()).padStart(2, '0')} KST`;

  // Weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      status: 'WEEKEND',
      message: '주말 휴장',
      badgeColor: 'bg-zinc-700 text-zinc-300',
      isRegularTrading: false,
      formattedTime,
    };
  }

  // Weekday Market Hours
  // 09:00 = 540 minutes, 15:30 = 930 minutes
  if (totalMinutes < 540) {
    return {
      status: 'PRE_MARKET',
      message: '장 시작 전',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      isRegularTrading: false,
      formattedTime,
    };
  } else if (totalMinutes >= 540 && totalMinutes <= 930) {
    return {
      status: 'OPEN',
      message: '정규장 개장 중',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse',
      isRegularTrading: true,
      formattedTime,
    };
  } else {
    return {
      status: 'CLOSED',
      message: '오늘 장 마감',
      badgeColor: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
      isRegularTrading: false,
      formattedTime,
    };
  }
}
