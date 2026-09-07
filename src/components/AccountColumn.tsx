'use client';

import React from 'react';
import { CalculatedAccount, CalculatedHolding } from '@/lib/types';
import { Edit3, TrendingUp, TrendingDown, ExternalLink, ShieldCheck } from 'lucide-react';

interface AccountColumnProps {
  account: CalculatedAccount;
  onEdit: (account: CalculatedAccount) => void;
}

export const AccountColumn: React.FC<AccountColumnProps> = ({
  account,
  onEdit,
}) => {
  const isAccProfit = account.totalProfit >= 0;
  const isAccDayProfit = account.dayProfit >= 0;

  const colorClasses = {
    indigo: 'border-indigo-500/40 from-indigo-950/30 to-slate-900',
    emerald: 'border-emerald-500/40 from-emerald-950/30 to-slate-900',
    amber: 'border-amber-500/40 from-amber-950/30 to-slate-900',
  }[account.color] || 'border-slate-800 from-slate-900 to-slate-900';

  const badgeColor = {
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  }[account.color] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-b ${colorClasses} p-4 lg:p-5 shadow-xl flex flex-col justify-between transition-all`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeColor}`}
            >
              {account.nickname}
            </span>
            <h3 className="font-bold text-white text-base tracking-tight">
              {account.owner}
            </h3>
          </div>
          <button
            onClick={() => onEdit(account)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1 border border-slate-700/60"
            title="계좌 포트폴리오 수정"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">수정</span>
          </button>
        </div>

        {/* Account Assets Summary */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 mb-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs text-slate-400">순자산 (평가+예수금)</span>
            <span className="text-xs text-indigo-400 font-semibold">
              비중 {(account.totalWeight || 0).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-baseline gap-1 mb-2.5">
            <span className="text-2xl font-black text-white tracking-tight">
              {account.totalAsset.toLocaleString('ko-KR')}
            </span>
            <span className="text-xs font-medium text-slate-400">원</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/60">
            <div>
              <span className="text-slate-500 block">누적 손익</span>
              <span
                className={`font-bold ${
                  isAccProfit ? 'text-rose-400' : 'text-blue-400'
                }`}
              >
                {isAccProfit ? '+' : ''}
                {account.totalProfit.toLocaleString('ko-KR')}원
                <span className="text-[11px] ml-1">
                  ({isAccProfit ? '+' : ''}
                  {account.returnRate.toFixed(2)}%)
                </span>
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">당일 변동</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  isAccDayProfit ? 'text-rose-400' : 'text-blue-400'
                }`}
              >
                {isAccDayProfit ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isAccDayProfit ? '+' : ''}
                {account.dayProfit.toLocaleString('ko-KR')}원
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/40">
            <span>매입 {account.totalBuy.toLocaleString('ko-KR')}원</span>
            <span>예수금 {account.cash.toLocaleString('ko-KR')}원</span>
          </div>
        </div>

        {/* Holdings List */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between px-1">
            <span>보유 ETF ({account.holdings.length}종목)</span>
            <span>평가손익 / 수익률</span>
          </div>

          {account.holdings.map((holding: CalculatedHolding) => {
            const isProfit = holding.evalProfit >= 0;
            const isDayUp = holding.diffPrice >= 0;

            return (
              <div
                key={holding.code}
                className="bg-slate-950/50 hover:bg-slate-900/80 border border-slate-800/70 hover:border-slate-700/80 rounded-xl p-3 transition-all"
              >
                {/* Header: Name & Code */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-200 hover:text-indigo-300">
                        {holding.name}
                      </h4>
                      <a
                        href={`https://finance.naver.com/item/main.naver?code=${holding.code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-indigo-400 transition-colors"
                        title="네이버 증권 상세 보기"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span>{holding.quantity}주</span>
                      <span className="text-slate-600">•</span>
                      <span>평단 {holding.avgPrice.toLocaleString('ko-KR')}원</span>
                    </div>
                  </div>

                  {/* Return rate badge */}
                  <div className="text-right">
                    <span
                      className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md ${
                        isProfit
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {isProfit ? '+' : ''}
                      {holding.returnRate.toFixed(2)}%
                    </span>
                    <span
                      className={`block text-[11px] font-semibold mt-0.5 ${
                        isProfit ? 'text-rose-400' : 'text-blue-400'
                      }`}
                    >
                      {isProfit ? '+' : ''}
                      {holding.evalProfit.toLocaleString('ko-KR')}원
                    </span>
                  </div>
                </div>

                {/* Price and Day change */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/40">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">현재가</span>
                    <span className="font-bold text-white">
                      {holding.nowPrice.toLocaleString('ko-KR')}원
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        isDayUp ? 'text-rose-400' : 'text-blue-400'
                      }`}
                    >
                      ({isDayUp ? '+' : ''}
                      {holding.diffRate.toFixed(2)}%)
                    </span>
                  </div>

                  <div className="text-right text-[11px] text-slate-300">
                    평가 {holding.evalAmount.toLocaleString('ko-KR')}원
                  </div>
                </div>

                {/* Weight Progress Bar */}
                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                  <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1 rounded-full"
                      style={{ width: `${Math.min(100, holding.accountWeight)}%` }}
                    />
                  </div>
                  <span className="whitespace-nowrap flex-shrink-0">
                    비중 {holding.accountWeight.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
