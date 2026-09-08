'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import defaultPortfolio from '@/data/default-portfolio.json';
import {
  PortfolioData,
  Account,
  StockQuote,
  CalculatedAccount,
  PortfolioSummary,
  TelegramConfig,
  MarketIndexData,
  InvestorTrend,
} from '@/lib/types';
import { getMarketStatus, MarketStatus } from '@/lib/market';
import { Header } from '@/components/Header';
import { SummaryCards } from '@/components/SummaryCards';
import { MarketIndices } from '@/components/MarketIndices';
import { ChartsSection } from '@/components/ChartsSection';
import { AccountColumn } from '@/components/AccountColumn';
import { AccountTabs } from '@/components/AccountTabs';
import { AccountEditorModal } from '@/components/AccountEditorModal';
import { TelegramSettingsModal } from '@/components/TelegramSettingsModal';
import { DataBackupModal } from '@/components/DataBackupModal';

const STORAGE_PORTFOLIO_KEY = 'family_etf_portfolio_v2';
const STORAGE_TELEGRAM_KEY = 'family_etf_telegram_config_v1';
const REFRESH_INTERVAL_SEC = 15;

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<PortfolioData>(
    defaultPortfolio as PortfolioData
  );
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [indices, setIndices] = useState<Record<string, MarketIndexData>>({});
  const [investorTrends, setInvestorTrends] = useState<
    Record<string, InvestorTrend>
  >({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(null);
  const [secondsUntilNextRefresh, setSecondsUntilNextRefresh] =
    useState(REFRESH_INTERVAL_SEC);
  const [viewMode, setViewMode] = useState<'columns' | 'tabs'>('columns');
  const [marketStatus, setMarketStatus] = useState<MarketStatus>(() =>
    getMarketStatus()
  );

  // Modals
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Telegram config
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    botToken: '',
    chatId: '',
    enabled: true,
    alertTime: '15:35',
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      // Check v2 first
      const savedPortfolioV2 = localStorage.getItem(STORAGE_PORTFOLIO_KEY);
      if (savedPortfolioV2) {
        setPortfolio(JSON.parse(savedPortfolioV2));
      } else {
        // Migration or initialize with defaultPortfolio (본인 -> 첫째 김은비 -> 둘째 김하율)
        setPortfolio(defaultPortfolio as PortfolioData);
        localStorage.setItem(
          STORAGE_PORTFOLIO_KEY,
          JSON.stringify(defaultPortfolio)
        );
      }

      const savedTelegram = localStorage.getItem(STORAGE_TELEGRAM_KEY);
      if (savedTelegram) {
        setTelegramConfig(JSON.parse(savedTelegram));
      }
    } catch (e) {
      console.error('Failed to load localStorage state:', e);
    }
  }, []);

  // Update market status every 10s
  useEffect(() => {
    const timer = setInterval(() => {
      setMarketStatus(getMarketStatus());
    }, 10_000);
    return () => clearInterval(timer);
  }, []);

  // Save portfolio to localStorage
  const savePortfolioData = useCallback((newData: PortfolioData) => {
    setPortfolio(newData);
    try {
      localStorage.setItem(STORAGE_PORTFOLIO_KEY, JSON.stringify(newData));
    } catch (e) {
      console.error('Failed to save portfolio to localStorage:', e);
    }
  }, []);

  // Save telegram config
  const saveTelegramConfig = useCallback((newConfig: TelegramConfig) => {
    setTelegramConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_TELEGRAM_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save telegram config:', e);
    }
  }, []);

  // Fetch Quotes & Indices
  const fetchMarketData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const codes = Array.from(
        new Set(
          portfolio.accounts.flatMap((acc) => acc.holdings.map((h) => h.code))
        )
      );

      const [quotesRes, indicesRes] = await Promise.all([
        codes.length > 0 ? fetch(`/api/quotes?codes=${codes.join(',')}`) : null,
        fetch('/api/indices'),
      ]);

      if (quotesRes && quotesRes.ok) {
        const quotesData = await quotesRes.json();
        setQuotes(quotesData);
      }

      if (indicesRes && indicesRes.ok) {
        const indicesData = await indicesRes.json();
        if (indicesData.indices) {
          setIndices(indicesData.indices);
        } else {
          setIndices(indicesData);
        }
        if (indicesData.investorTrends) {
          setInvestorTrends(indicesData.investorTrends);
        }
      }

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLastUpdatedTime(timeStr);
    } catch (err) {
      console.error('Failed to fetch real-time market data:', err);
    } finally {
      setIsRefreshing(false);
      setSecondsUntilNextRefresh(REFRESH_INTERVAL_SEC);
    }
  }, [portfolio]);

  // Initial fetch and 1-second countdown
  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsUntilNextRefresh((prev) => {
        if (prev <= 1) {
          fetchMarketData();
          return REFRESH_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // Calculations
  const { calculatedAccounts, summary } = useMemo(() => {
    let grandTotalBuy = 0;
    let grandTotalEval = 0;
    let grandDayProfit = 0;
    let grandTotalCash = 0;

    // First pass: calculate account totals
    const initialCalculated = portfolio.accounts.map((acc) => {
      let accBuy = 0;
      let accEval = 0;
      let accDayProfit = 0;

      const holdings = acc.holdings.map((h) => {
        const q = quotes[h.code];
        const nowPrice = q ? q.nowPrice : h.avgPrice;
        const diffPrice = q ? q.diffPrice : 0;
        const diffRate = q ? q.diffRate : 0;
        const prevClose = q ? q.prevClose : h.avgPrice;

        const buyAmount = h.quantity * h.avgPrice;
        const evalAmount = h.quantity * nowPrice;
        const evalProfit = evalAmount - buyAmount;
        const returnRate = buyAmount > 0 ? (evalProfit / buyAmount) * 100 : 0;
        const dayChangeAmount = h.quantity * diffPrice;

        accBuy += buyAmount;
        accEval += evalAmount;
        accDayProfit += dayChangeAmount;

        return {
          ...h,
          nowPrice,
          diffPrice,
          diffRate,
          prevClose,
          buyAmount,
          evalAmount,
          evalProfit,
          returnRate,
          dayChangeAmount,
          accountWeight: 0,
          totalWeight: 0,
        };
      });

      const accProfit = accEval - accBuy;
      const accReturnRate = accBuy > 0 ? (accProfit / accBuy) * 100 : 0;
      const totalAsset = accEval + (acc.cash || 0);

      grandTotalBuy += accBuy;
      grandTotalEval += accEval;
      grandDayProfit += accDayProfit;
      grandTotalCash += acc.cash || 0;

      return {
        id: acc.id,
        owner: acc.owner,
        nickname: acc.nickname,
        color: acc.color,
        cash: acc.cash || 0,
        totalBuy: accBuy,
        totalEval: accEval,
        totalProfit: accProfit,
        returnRate: accReturnRate,
        dayProfit: accDayProfit,
        totalAsset,
        totalWeight: 0,
        holdings,
      };
    });

    const grandTotalAsset = grandTotalEval + grandTotalCash;
    const grandTotalProfit = grandTotalEval - grandTotalBuy;
    const grandReturnRate =
      grandTotalBuy > 0 ? (grandTotalProfit / grandTotalBuy) * 100 : 0;
    const grandDayProfitRate =
      grandTotalAsset - grandDayProfit > 0
        ? (grandDayProfit / (grandTotalAsset - grandDayProfit)) * 100
        : 0;

    // Second pass: weights
    const calculatedAccounts: CalculatedAccount[] = initialCalculated.map(
      (acc) => {
        const totalWeight =
          grandTotalAsset > 0 ? (acc.totalAsset / grandTotalAsset) * 100 : 0;

        const holdings = acc.holdings.map((h) => {
          const accountWeight =
            acc.totalEval > 0 ? (h.evalAmount / acc.totalEval) * 100 : 0;
          const totalWeight =
            grandTotalAsset > 0 ? (h.evalAmount / grandTotalAsset) * 100 : 0;

          return {
            ...h,
            accountWeight,
            totalWeight,
          };
        });

        return {
          ...acc,
          totalWeight,
          holdings,
        };
      }
    );

    const summary: PortfolioSummary = {
      totalBuy: grandTotalBuy,
      totalEval: grandTotalEval,
      totalProfit: grandTotalProfit,
      returnRate: grandReturnRate,
      dayProfit: grandDayProfit,
      dayProfitRate: grandDayProfitRate,
      totalCash: grandTotalCash,
      totalAsset: grandTotalAsset,
      accountCount: calculatedAccounts.length,
      holdingsCount: portfolio.accounts.reduce(
        (sum, a) => sum + a.holdings.length,
        0
      ),
      updatedAt: new Date().toISOString(),
    };

    return { calculatedAccounts, summary };
  }, [portfolio, quotes]);

  // Handle account update
  const handleSaveAccount = (updatedAccount: Account) => {
    const updatedAccounts = portfolio.accounts.map((a) =>
      a.id === updatedAccount.id ? updatedAccount : a
    );
    savePortfolioData({
      ...portfolio,
      updatedAt: new Date().toISOString(),
      accounts: updatedAccounts,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        marketStatus={marketStatus}
        isRefreshing={isRefreshing}
        onRefresh={fetchMarketData}
        secondsUntilNextRefresh={secondsUntilNextRefresh}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        lastUpdatedTime={lastUpdatedTime}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {/* Real-time KOSPI, KOSDAQ & FUT Indices and Investor Trends */}
        <MarketIndices indices={indices} investorTrends={investorTrends} />

        {/* Top Summary Metric Cards */}
        <SummaryCards summary={summary} />

        {/* Account Views */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>계좌별 ETF 포트폴리오</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                {viewMode === 'columns' ? '3단 병렬 뷰' : '탭 뷰'}
              </span>
            </h2>
          </div>

          {viewMode === 'columns' ? (
            /* 3-Column Parallel View */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {calculatedAccounts.map((account) => (
                <AccountColumn
                  key={account.id}
                  account={account}
                  onEdit={(acc) => {
                    const original = portfolio.accounts.find(
                      (a) => a.id === acc.id
                    );
                    if (original) setEditingAccount(original);
                  }}
                />
              ))}
            </div>
          ) : (
            /* Tab Switching View */
            <AccountTabs
              accounts={calculatedAccounts}
              onEdit={(acc) => {
                const original = portfolio.accounts.find((a) => a.id === acc.id);
                if (original) setEditingAccount(original);
              }}
            />
          )}
        </div>

        {/* Charts Section (맨 아래 배치) */}
        <ChartsSection accounts={calculatedAccounts} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500">
        <p>
          가족 ETF 자산 관리 시스템 • 실시간 시세 출처: 네이버 증권 (지연 없는
          실시간 호가 연동)
        </p>
      </footer>

      {/* Modals */}
      <AccountEditorModal
        account={editingAccount}
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        onSave={handleSaveAccount}
      />

      <TelegramSettingsModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        config={telegramConfig}
        onSave={saveTelegramConfig}
        summary={summary}
        accounts={calculatedAccounts}
      />

      <DataBackupModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        currentData={portfolio}
        onRestoreData={(newData) => savePortfolioData(newData)}
      />
    </div>
  );
}
