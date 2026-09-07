'use client';

import React, { useRef } from 'react';
import { PortfolioData } from '@/lib/types';
import { X, Download, Upload, RotateCcw, Database } from 'lucide-react';
import defaultPortfolio from '@/data/default-portfolio.json';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: PortfolioData;
  onRestoreData: (data: PortfolioData) => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  currentData,
  onRestoreData,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Export JSON
  const handleExport = () => {
    const jsonStr = JSON.stringify(currentData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-etf-portfolio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.accounts && Array.isArray(parsed.accounts)) {
          if (confirm('선택한 파일의 포트폴리오 데이터로 복원하시겠습니까?')) {
            onRestoreData(parsed);
            alert('포트폴리오가 성공적으로 복원되었습니다.');
            onClose();
          }
        } else {
          alert('올바른 포트폴리오 JSON 형식이 아닙니다.');
        }
      } catch (err) {
        alert('JSON 파일을 파싱하는 도중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (
      confirm(
        '노션 원본 기준의 초기 포트폴리오 데이터로 복원하시겠습니까? (현재 수정한 내용이 초기화됩니다)'
      )
    ) {
      onRestoreData(defaultPortfolio as PortfolioData);
      alert('초기 데이터로 복원되었습니다.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                포트폴리오 데이터 관리
              </h3>
              <p className="text-xs text-slate-400">
                백업 파일 저장 및 데이터 초기화
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
        <div className="p-6 space-y-3.5">
          {/* Export button */}
          <button
            onClick={handleExport}
            className="w-full p-3.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl text-left flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  포트폴리오 백업 다운로드
                </span>
                <span className="text-[11px] text-slate-400">
                  현재 수량 및 평단가를 JSON 파일로 저장
                </span>
              </div>
            </div>
          </button>

          {/* Import button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-3.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl text-left flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  백업 파일 불러오기 (복원)
                </span>
                <span className="text-[11px] text-slate-400">
                  저장해둔 JSON 백업 파일 업로드
                </span>
              </div>
            </div>
          </button>

          {/* Reset button */}
          <button
            onClick={handleResetToDefault}
            className="w-full p-3.5 bg-rose-950/20 hover:bg-rose-950/30 border border-rose-500/30 rounded-xl text-left flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-300 block">
                  노션 초기 데이터로 리셋
                </span>
                <span className="text-[11px] text-rose-400/80">
                  2026-09-07 노션 원본 값으로 즉시 복구
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
