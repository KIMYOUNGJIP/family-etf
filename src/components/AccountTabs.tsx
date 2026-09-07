'use client';

import React, { useState } from 'react';
import { CalculatedAccount, CalculatedHolding } from '@/lib/types';
import { Edit3, ExternalLink, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface AccountTabsProps {
  accounts: CalculatedAccount[];
  onEdit: (account: CalculatedAccount) => void;
}

export const AccountTabs: React.FC<AccountTabsProps> = ({
  accounts,
  onEdit,
}) => {
  const [activeTabId, setActiveTabId] = useState<string>(accounts[0]?.id || '');

  const activeAccount =
    accounts.find((a) => a.id === activeTabId) || accounts[0];

  if (!activeAccount) return null;

  const isProfit = activeAccount.totalProfit >= 0;
  const isDayProfit = activeAccount.dayProfit >= 0;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl mb-6">
      {/* Tab Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {accounts.map((acc) => {
            const isActive = acc.id === activeAccount.id;
            return (
              <button
                key={acc.id}
                onClick={() => setActiveTabId(acc.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500'
                    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{acc.owner}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-black/20 font-medium">
                  {acc.nickname}
                </span>
              </button>
            );
          })}
        </div>

        {/* Edit Button */}
        <button
          onClick={() => onEdit(activeAccount)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all ml-auto"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>계좌 종목/금액 수정</span>
        </button>
      </div>

      {/* Account Metric Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 mb-5">
        <div>
          <span className="text-xs text-slate-400 block mb-1">총 순자산</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-white">
              {activeAccount.totalAsset.toLocaleString('ko-KR')}
            </span>
            <span className="text-xs text-slate-400">원</span>
          </div>
          <span className="text-[11px] text-indigo-400 font-medium">
            전체 비중 {(activeAccount.totalWeight || 0).toFixed(1)}%
          </span>
        </div>

        <div>
          <span className="text-xs text-slate-400 block mb-1">누적 평가손익</span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-xl sm:text-2xl font-black ${
                isProfit ? 'text-rose-400' : 'text-blue-400'
              }`}
            >
              {isProfit ? '+' : ''}
              {activeAccount.totalProfit.toLocaleString('ko-KR')}
            </span>
            <span className="text-xs text-slate-400">원</span>
          </div>
          <span
            className={`text-[11px] font-bold ${
              isProfit ? 'text-rose-400' : 'text-blue-400'
            }`}
          >
            {isProfit ? '+' : ''}
            {activeAccount.returnRate.toFixed(2)}%
          </span>
        </div>

        <div>
          <span className="text-xs text-slate-400 block mb-1">당일 변동</span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-xl sm:text-2xl font-black flex items-center gap-1 ${
                isDayProfit ? 'text-rose-400' : 'text-blue-400'
              }`}
            >
              {isDayProfit ? '+' : ''}
              {activeAccount.dayProfit.toLocaleString('ko-KR')}
            </span>
            <span className="text-xs text-slate-400">원</span>
          </div>
          <span className="text-[11px] text-slate-500">전일 종가 대비</span>
        </div>

        <div>
          <span className="text-xs text-slate-400 block mb-1">매입금액 & 예수금</span>
          <div className="text-sm font-bold text-slate-200">
            매입 {activeAccount.totalBuy.toLocaleString('ko-KR')}원
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            예수금 {activeAccount.cash.toLocaleString('ko-KR')}원
          </div>
        </div>
      </div>

      {/* Detailed Holdings Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-3.5">종목명 (코드)</th>
              <th className="py-3 px-3 text-right">보유수량</th>
              <th className="py-3 px-3 text-right">평균단가</th>
              <th className="py-3 px-3 text-right">현재가</th>
              <th className="py-3 px-3 text-right">전일비</th>
              <th className="py-3 px-3 text-right">매입금액</th>
              <th className="py-3 px-3 text-right">평가금액</th>
              <th className="py-3 px-3 text-right">평가손익</th>
              <th className="py-3 px-3 text-right">수익률</th>
              <th className="py-3 px-3 text-right">계좌비중</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {activeAccount.holdings.map((h: CalculatedHolding) => {
              const isProfit = h.evalProfit >= 0;
              const isDayUp = h.diffPrice >= 0;

              return (
                <tr
                  key={h.code}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-3.5 font-bold text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span>{h.name}</span>
                      <a
                        href={`https://finance.naver.com/item/main.naver?code=${h.code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-indigo-400"
                        title="네이버 증권 바로가기"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {h.code}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-300">
                    {h.quantity}주
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300">
                    {h.avgPrice.toLocaleString('ko-KR')}원
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-white">
                    {h.nowPrice.toLocaleString('ko-KR')}원
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-semibold ${
                      isDayUp ? 'text-rose-400' : 'text-blue-400'
                    }`}
                  >
                    {isDayUp ? '+' : ''}
                    {h.diffRate.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400">
                    {h.buyAmount.toLocaleString('ko-KR')}원
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-200">
                    {h.evalAmount.toLocaleString('ko-KR')}원
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-bold ${
                      isProfit ? 'text-rose-400' : 'text-blue-400'
                    }`}
                  >
                    {isProfit ? '+' : ''}
                    {h.evalProfit.toLocaleString('ko-KR')}원
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-bold ${
                        isProfit
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {isProfit ? '+' : ''}
                      {h.returnRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-indigo-300">
                    {h.accountWeight.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
