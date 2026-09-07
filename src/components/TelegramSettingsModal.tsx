'use client';

import React, { useState } from 'react';
import { TelegramConfig, PortfolioSummary, CalculatedAccount } from '@/lib/types';
import { X, Bell, Send, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TelegramConfig;
  onSave: (config: TelegramConfig) => void;
  summary: PortfolioSummary;
  accounts: CalculatedAccount[];
}

export const TelegramSettingsModal: React.FC<TelegramSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  summary,
  accounts,
}) => {
  if (!isOpen) return null;

  const [botToken, setBotToken] = useState(config.botToken || '');
  const [chatId, setChatId] = useState(config.chatId || '');
  const [enabled, setEnabled] = useState(config.enabled ?? true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTestSend = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setTestResult({
        success: false,
        message: '봇 토큰(Bot Token)과 Chat ID를 먼저 입력해주세요.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: botToken.trim(),
          chatId: chatId.trim(),
          summary,
          accounts,
          isTest: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: '텔레그램 메시지가 성공적으로 발송되었습니다! 텔레그램을 확인하세요.',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || '발송 실패. 토큰 또는 Chat ID를 확인해주세요.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || '네트워크 오류가 발생했습니다.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSave({
      ...config,
      botToken: botToken.trim(),
      chatId: chatId.trim(),
      enabled,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                장 마감 텔레그램 알림 설정
              </h3>
              <p className="text-xs text-slate-400">
                매일 평일 장 마감(15:35) 후 가족 계좌 결산 리포트 자동 발송
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Enabled Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
            <div>
              <span className="text-xs font-bold text-white block">
                일일 마감 리포트 알림 활성화
              </span>
              <span className="text-[11px] text-slate-400">
                평일 장 마감 후 계좌별 평가액 및 당일 손익 자동 발송
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Bot Token Input */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              텔레그램 봇 토큰 (Bot Token)
            </label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="예: 7123456789:AAF..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Chat ID Input */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              텔레그램 Chat ID (수신자 ID)
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="예: 123456789"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Guide Note */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block mb-1">
              💡 텔레그램 봇 1분 생성 팁:
            </span>
            <p>
              1. 텔레그램에서 <b>@BotFather</b>에게 <code>/newbot</code> 전송 후 발급된 토큰 복사
            </p>
            <p>
              2. 텔레그램 <b>@userinfobot</b>에게 메시지를 보내 나의 <b>Id</b>(숫자) 확인
            </p>
            <p>
              3. 생성한 내 봇에게 먼저 아무 말(예: /start)이나 1회 전송 후 아래 테스트를 누르세요.
            </p>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                testResult.success
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{testResult.message}</span>
            </div>
          )}

          {/* Test Button */}
          <button
            type="button"
            onClick={handleTestSend}
            disabled={isTesting}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-sky-300 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isTesting ? '발송 중...' : '지금 텔레그램으로 테스트 리포트 발송'}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all"
          >
            설정 저장
          </button>
        </div>
      </div>
    </div>
  );
};
