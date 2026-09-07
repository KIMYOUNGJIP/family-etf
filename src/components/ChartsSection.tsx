'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import { CalculatedAccount } from '@/lib/types';
import { PieChart as PieIcon, BarChart3 } from 'lucide-react';

interface ChartsSectionProps {
  accounts: CalculatedAccount[];
}

const COLORS = [
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

export const ChartsSection: React.FC<ChartsSectionProps> = ({ accounts }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [chartTab, setChartTab] = useState<'weights' | 'returns'>('weights');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-64 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse mb-6" />
    );
  }

  // Aggregate holdings across all accounts for overall ETF distribution
  const holdingMap: Record<
    string,
    { name: string; evalAmount: number; buyAmount: number; code: string }
  > = {};

  accounts.forEach((acc) => {
    acc.holdings.forEach((h) => {
      if (!holdingMap[h.code]) {
        holdingMap[h.code] = {
          name: h.name,
          evalAmount: 0,
          buyAmount: 0,
          code: h.code,
        };
      }
      holdingMap[h.code].evalAmount += h.evalAmount;
      holdingMap[h.code].buyAmount += h.buyAmount;
    });
  });

  const holdingList = Object.values(holdingMap).sort(
    (a, b) => b.evalAmount - a.evalAmount
  );

  const pieData = holdingList.map((item) => ({
    name: item.name.length > 14 ? item.name.substring(0, 14) + '…' : item.name,
    fullName: item.name,
    value: item.evalAmount,
  }));

  const barData = holdingList.map((item) => {
    const profit = item.evalAmount - item.buyAmount;
    const rate = item.buyAmount > 0 ? (profit / item.buyAmount) * 100 : 0;
    return {
      name: item.name.length > 10 ? item.name.substring(0, 10) + '…' : item.name,
      fullName: item.name,
      returnRate: parseFloat(rate.toFixed(2)),
      profit,
    };
  });

  const accountPieData = accounts.map((acc) => ({
    name: acc.owner,
    value: acc.totalAsset,
  }));

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            📊 포트폴리오 시각화 분석
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            가족 전체 종목별 비중 및 누적 수익률 비교
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setChartTab('weights')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              chartTab === 'weights'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>종목 및 계좌 비중</span>
          </button>
          <button
            onClick={() => setChartTab('returns')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              chartTab === 'returns'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>종목별 수익률</span>
          </button>
        </div>
      </div>

      {chartTab === 'weights' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* ETF Distribution */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>ETF 종목별 평가액 비중</span>
              <span className="text-[11px] text-slate-500">총 6종</span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                            <p className="font-bold text-white mb-1">
                              {data.fullName}
                            </p>
                            <p className="text-indigo-400 font-semibold">
                              평가액: {data.value.toLocaleString('ko-KR')}원
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
              {pieData.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-[11px] text-slate-300 truncate"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="truncate">{item.fullName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Account Distribution */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>가족 계좌별 순자산 비중</span>
              <span className="text-[11px] text-slate-500">총 3계좌</span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={accountPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {accounts.map((acc) => (
                      <Cell
                        key={acc.id}
                        fill={
                          acc.color === 'indigo'
                            ? '#6366f1'
                            : acc.color === 'amber'
                            ? '#f59e0b'
                            : '#10b981'
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                            <p className="font-bold text-white mb-1">
                              {data.name}
                            </p>
                            <p className="text-emerald-400 font-semibold">
                              순자산: {data.value.toLocaleString('ko-KR')}원
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center gap-1.5 text-xs text-slate-300"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      acc.color === 'indigo'
                        ? 'bg-indigo-500'
                        : acc.color === 'amber'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span>
                    {acc.owner} ({(acc.totalWeight || 0).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Return Rates Bar Chart */
        <div>
          <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
            <span>ETF 종목별 통합 수익률 (%)</span>
            <span className="text-[11px] text-slate-400">
              빨강(수익) / 파랑(손실)
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => `${v}%`}
                />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isProfit = data.returnRate >= 0;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                          <p className="font-bold text-white mb-1">
                            {data.fullName}
                          </p>
                          <p
                            className={`font-semibold ${
                              isProfit ? 'text-rose-400' : 'text-blue-400'
                            }`}
                          >
                            수익률: {isProfit ? '+' : ''}
                            {data.returnRate}%
                          </p>
                          <p className="text-slate-400 mt-0.5">
                            손익금: {isProfit ? '+' : ''}
                            {data.profit.toLocaleString('ko-KR')}원
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="returnRate" radius={[4, 4, 4, 4]}>
                  {barData.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={entry.returnRate >= 0 ? '#f43f5e' : '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
