'use client';

import React from 'react';
import { MarketStatus } from '@/lib/market';
import { RefreshCw, Settings, Database, LayoutGrid, Columns, Clock } from 'lucide-react';

interface HeaderProps {
  marketStatus: MarketStatus;
  isRefreshing: boolean;
  onRefresh: () => void;
  secondsUntilNextRefresh: number;
  viewMode: 'columns' | 'tabs';
  onToggleViewMode: (mode: 'columns' | 'tabs') => void;
  onOpenTelegramModal: () => void;
  onOpenDataModal: () => void;
  lastUpdatedTime: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  marketStatus,
  isRefreshing,
  onRefresh,
  secondsUntilNextRefresh,
  viewMode,
  onToggleViewMode,
  onOpenTelegramModal,
  onOpenDataModal,
  lastUpdatedTime,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title and Badge */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20 font-bold">
              📈
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                가족 ETF 포트폴리오
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-normal border border-indigo-500/30">
                  Live
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                본인 · 김은비 · 김하율 계좌 실시간 변동 추적
              </p>
            </div>
          </div>

          {/* Market Status Badge (Mobile visible) */}
          <div className="md:hidden">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${marketStatus.badgeColor}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${marketStatus.status === 'OPEN' ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
              {marketStatus.message}
            </span>
          </div>
        </div>

        {/* Center: Market Status & Time (Desktop) */}
        <div className="hidden md:flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold ${marketStatus.badgeColor}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${marketStatus.status === 'OPEN' ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
            {marketStatus.message}
          </span>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{marketStatus.formattedTime}</span>
          </div>
          {lastUpdatedTime && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">최종조회 {lastUpdatedTime}</span>
            </>
          )}
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* View Mode Switcher */}
          <div className="bg-slate-900 border border-slate-800 p-0.5 rounded-lg flex items-center">
            <button
              onClick={() => onToggleViewMode('columns')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'columns'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="3단 나란히 보기"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3단 분할</span>
            </button>
            <button
              onClick={() => onToggleViewMode('tabs')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'tabs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="탭 전환하여 보기"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">탭 뷰</span>
            </button>
          </div>

          {/* Refresh Button with Countdown */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-xs font-medium text-slate-200 transition-all disabled:opacity-50"
            title="실시간 시세 갱신"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>{isRefreshing ? '조회중...' : `${secondsUntilNextRefresh}s`}</span>
          </button>

          {/* Data Backup Modal Toggle */}
          <button
            onClick={onOpenDataModal}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 transition-all"
            title="데이터 백업 및 포트폴리오 관리"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Telegram Settings Modal Toggle */}
          <button
            onClick={onOpenTelegramModal}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-400 hover:text-sky-400 transition-all"
            title="텔레그램 장마감 알림 설정"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
