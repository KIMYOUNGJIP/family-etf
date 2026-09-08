'use client';

import React, { useEffect, useState } from 'react';
import { MarketIndexData, InvestorTrend } from '@/lib/types';
import { TrendingUp, TrendingDown, Activity, UserCheck } from 'lucide-react';
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
  investorTrends?: Record<string, InvestorTrend>;
  isLoading?: boolean;
}

export const MarketIndices: React.FC<MarketIndicesProps> = ({
  indices,
  investorTrends = {},
  isLoading,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const kospi = indices['KOSPI'];
  const kosdaq = indices['KOSDAQ'];
  const fut = indices['FUT'];

  if (!isMounted) {
    return (
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-44 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
          <div className="h-44 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
          <div className="h-44 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
        </div>
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
    const padding = (maxPrice - minPrice) * 0.1 || 2;

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
        <div className="h-20 w-full my-1">
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
              당일 분봉 차트 수집 중...
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

  const renderTrendRow = (
    label: string,
    val: number,
    unit: string,
    maxAbs: number
  ) => {
    const isBuy = val >= 0;
    const barWidth = maxAbs > 0 ? Math.min(100, Math.round((Math.abs(val) / maxAbs) * 100)) : 0;

    return (
      <div className="flex items-center justify-between gap-2 text-xs py-1">
        <span className="text-slate-400 w-10 flex-shrink-0 font-medium">
          {label}
        </span>
        {/* Visual Bar Gauge */}
        <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden flex items-center relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isBuy ? 'bg-rose-500' : 'bg-blue-500'
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        {/* Value */}
        <span
          className={`font-bold font-mono text-right w-24 flex-shrink-0 ${
            isBuy ? 'text-rose-400' : 'text-blue-400'
          }`}
        >
          {isBuy ? '+' : ''}
          {val.toLocaleString('ko-KR')}
          <span className="text-[10px] text-slate-500 ml-0.5">{unit}</span>
        </span>
      </div>
    );
  };

  const renderTrendCard = (trend?: InvestorTrend) => {
    if (!trend) {
      return (
        <div className="h-36 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
      );
    }

    const maxVal = Math.max(
      Math.abs(trend.personal),
      Math.abs(trend.foreign),
      Math.abs(trend.institutional),
      1
    );

    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white">
              {trend.marketName} 수급
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {trend.code}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            단위: {trend.unit}
          </span>
        </div>

        <div className="space-y-1.5">
          {renderTrendRow('개인', trend.personal, trend.unit, maxVal)}
          {renderTrendRow('외국인', trend.foreign, trend.unit, maxVal)}
          {renderTrendRow('기관', trend.institutional, trend.unit, maxVal)}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6 space-y-4">
      {/* 1. Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>국내 대표 지수 및 선물 실시간 당일 동향</span>
        </h3>
        <span className="text-[11px] text-slate-400">
          코스피 · 코스닥 · 선물 실시간 분봉 및 수급
        </span>
      </div>

      {/* 2. Top Row: 3 Indices Intraday Charts (KOSPI | KOSDAQ | FUT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderIndexCard(kospi, '코스피')}
        {renderIndexCard(kosdaq, '코스닥')}
        {renderIndexCard(fut, '코스피200 선물')}
      </div>

      {/* 3. Bottom Row: Investor Trends (Personal, Foreign, Institutional) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderTrendCard(investorTrends['KOSPI'])}
        {renderTrendCard(investorTrends['KOSDAQ'])}
        {renderTrendCard(investorTrends['FUT'])}
      </div>
    </div>
  );
};
