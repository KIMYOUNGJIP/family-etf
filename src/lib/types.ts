export interface Holding {
  code: string;
  name: string;
  quantity: number;
  avgPrice: number;
}

export interface Account {
  id: string;
  owner: string;
  nickname: string;
  color: 'indigo' | 'emerald' | 'amber' | 'blue' | 'purple' | 'rose';
  cash: number;
  holdings: Holding[];
}

export interface PortfolioData {
  updatedAt: string;
  accounts: Account[];
}

export interface StockQuote {
  code: string;
  name: string;
  nowPrice: number;
  diffPrice: number; // 전일 대비 금액 (부호 포함)
  diffRate: number;  // 전일 대비 등락률 (%)
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  prevClose: number;
  volume: number;
  updatedAt: string;
}

export interface CalculatedHolding extends Holding {
  nowPrice: number;
  diffPrice: number;
  diffRate: number;
  prevClose: number;
  buyAmount: number;         // 총 매입금액 = quantity * avgPrice
  evalAmount: number;        // 총 평가금액 = quantity * nowPrice
  evalProfit: number;        // 평가손익 = evalAmount - buyAmount
  returnRate: number;        // 수익률(%) = (evalProfit / buyAmount) * 100
  dayChangeAmount: number;   // 당일 손익 변동 = quantity * diffPrice
  accountWeight: number;     // 계좌 내 비중(%)
  totalWeight: number;       // 전체 자산 내 비중(%)
}

export interface CalculatedAccount {
  id: string;
  owner: string;
  nickname: string;
  color: string;
  cash: number;
  totalBuy: number;          // 주식 매입합계
  totalEval: number;         // 주식 평가합계
  totalProfit: number;       // 주식 평가손익
  returnRate: number;        // 계좌 수익률(%)
  dayProfit: number;         // 당일 평가손익 변동
  totalAsset: number;        // 순자산 = totalEval + cash
  totalWeight: number;       // 전체 자산 대비 비중(%)
  holdings: CalculatedHolding[];
}

export interface PortfolioSummary {
  totalBuy: number;
  totalEval: number;
  totalProfit: number;
  returnRate: number;
  dayProfit: number;
  dayProfitRate: number;
  totalCash: number;
  totalAsset: number;
  accountCount: number;
  holdingsCount: number;
  updatedAt: string;
}

export interface MarketIndexPoint {
  time: string;
  price: number;
}

export interface MarketIndexData {
  code: string; // 'KOSPI' | 'KOSDAQ' | 'FUT'
  name: string;
  nowPrice: number;
  diffPrice: number;
  diffRate: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  chartPoints: MarketIndexPoint[];
  updatedAt: string;
}

export interface InvestorTrend {
  code: string; // 'KOSPI' | 'KOSDAQ' | 'FUT'
  marketName: string;
  unit: string; // '억 원' or '계약'
  personal: number;      // 개인
  foreign: number;       // 외국인
  institutional: number; // 기관
  updatedAt: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  alertTime: string; // "15:35"
  lastSentDate?: string; // "2026-09-07"
}
