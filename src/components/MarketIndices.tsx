'use client';

import React, { useEffect, useState } from 'react';
import { MarketIndexData } from '@/lib/types';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface MarketIndicesProps {
  indices: Record<string, MarketIndexData>;
  isLoading?: boolean;
}

export const MarketIndices: React.FC<MarketIndicesProps> = ({
  indices,
  isLoading,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const kospi = indices['KOSPI'];
  const kosdaq = indices['KOSDAQ'];

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="h-44 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
        <div className="h-44 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const renderIndexCard = (item?: MarketIndexData, defaultName = '지수') => {
    if (!item) {
      return (
        <div className="h-44 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
      );
    }

    const isUp = item.diffPrice >= 0;
    const strokeColor = isUp ? '#f43f5e' : '#3b82f6';
    const gradientId = `gradient-${item.code}`;

    // Compute min and max for Y-axis domain
    const prices = item.chartPoints.map((p) => p.price);
    const minPrice = prices.length > 0 ? Math.min(...prices) : item.nowPrice * 0.98;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : item.nowPrice * 1.02;
    const padding = (maxPrice - minPrice) * 0.1 || 5;

    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
        {/* Top: Name, Points, Day change */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-white tracking-wide">
                {item.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                {item.code}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white tracking-tight">
                {item.nowPrice.toLocaleString('ko-KR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-slate-400">p</span>
            </div>
          </div>

          <div className="text-right">
            <div
              className={`flex items-center justify-end gap-1 text-xs font-bold ${
                isUp ? 'text-rose-400' : 'text-blue-400'
              }`}
            >
              {isUp ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>
                {isUp ? '+' : ''}
                {item.diffPrice.toFixed(2)}
              </span>
            </div>
            <span
              className={`text-xs font-semibold ${
                isUp ? 'text-rose-400' : 'text-blue-400'
              }`}
            >
              ({isUp ? '+' : ''}
              {item.diffRate.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Intraday Sparkline / AreaChart */}
        <div className="h-24 w-full my-1">
          {item.chartPoints.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={item.chartPoints}
                margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={strokeColor}
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor={strokeColor}
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis
                  domain={[minPrice - padding, maxPrice + padding]}
                  hide
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg shadow-xl text-[11px]">
                          <span className="text-slate-400 block">
                            {data.time}
                          </span>
                          <span className="font-bold text-white">
                            {Number(data.price).toFixed(2)}p
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={strokeColor}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              당일 차트 데이터 수집 중...
            </div>
          )}
        </div>

        {/* Bottom details: Open / High / Low */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <div>
            시가 <span className="text-slate-200">{item.openPrice.toFixed(2)}</span>
          </div>
          <div>
            고가 <span className="text-rose-400">{item.highPrice.toFixed(2)}</span>
          </div>
          <div>
            저가 <span className="text-blue-400">{item.lowPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>국내 대표 지수 실시간 당일 동향</span>
        </h3>
        <span className="text-[11px] text-slate-500">당일 분봉 차트 실시간 연동</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderIndexCard(kospi, '코스피')}
        {renderIndexCard(kosdaq, '코스닥')}
      </div>
    </div>
  );
};
