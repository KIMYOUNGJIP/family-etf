'use client';

import React from 'react';
import { PortfolioSummary } from '@/lib/types';
import { TrendingUp, TrendingDown, DollarSign, Wallet, PieChart, ShieldAlert } from 'lucide-react';

interface SummaryCardsProps {
  summary: PortfolioSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const isTotalProfit = summary.totalProfit >= 0;
  const isDayProfit = summary.dayProfit >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
      {/* Card 1: 총 순자산 */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800/80 rounded-2xl p-4 lg:p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium tracking-wide">총 순자산 (주식+예수금)</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            {summary.totalAsset.toLocaleString('ko-KR')}
          </span>
          <span className="text-sm font-semibold text-slate-400">원</span>
        </div>
        <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-400">
          <span>계좌 3개</span>
          <span className="text-slate-600">•</span>
          <span>예수금 {summary.totalCash.toLocaleString('ko-KR')}원</span>
        </div>
      </div>

      {/* Card 2: 당일 변동 손익 */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800/80 rounded-2xl p-4 lg:p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium tracking-wide">당일 손익 변동</span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
              isDayProfit
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}
          >
            {isDayProfit ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${
              isDayProfit ? 'text-rose-400' : 'text-blue-400'
            }`}
          >
            {isDayProfit ? '+' : ''}
            {summary.dayProfit.toLocaleString('ko-KR')}
          </span>
          <span className="text-sm font-semibold text-slate-400">원</span>
        </div>
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          <span
            className={`font-semibold ${
              isDayProfit ? 'text-rose-400' : 'text-blue-400'
            }`}
          >
            {isDayProfit ? '+' : ''}
            {summary.dayProfitRate.toFixed(2)}%
          </span>
          <span className="text-slate-500">전일 종가 대비</span>
        </div>
      </div>

      {/* Card 3: 누적 평가손익 */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800/80 rounded-2xl p-4 lg:p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium tracking-wide">누적 평가손익</span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
              isTotalProfit
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}
          >
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${
              isTotalProfit ? 'text-rose-400' : 'text-blue-400'
            }`}
          >
            {isTotalProfit ? '+' : ''}
            {summary.totalProfit.toLocaleString('ko-KR')}
          </span>
          <span className="text-sm font-semibold text-slate-400">원</span>
        </div>
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          <span
            className={`font-bold px-1.5 py-0.5 rounded ${
              isTotalProfit
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}
          >
            {isTotalProfit ? '+' : ''}
            {summary.returnRate.toFixed(2)}%
          </span>
          <span className="text-slate-500">매입 대비</span>
        </div>
      </div>

      {/* Card 4: 주식 매입 vs 평가금액 */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800/80 rounded-2xl p-4 lg:p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium tracking-wide">주식 평가금액</span>
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            {summary.totalEval.toLocaleString('ko-KR')}
          </span>
          <span className="text-sm font-semibold text-slate-400">원</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
          <span>총 매입 {summary.totalBuy.toLocaleString('ko-KR')}원</span>
          <span className="text-slate-500">ETF {summary.holdingsCount}건</span>
        </div>
      </div>
    </div>
  );
};
