'use client';

import React, { useState } from 'react';
import { Account, Holding } from '@/lib/types';
import {
  X,
  Plus,
  Trash2,
  Save,
  Calculator,
  ChevronUp,
  ChevronDown,
  Check,
} from 'lucide-react';

interface AccountEditorModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAccount: Account) => void;
}

export const AccountEditorModal: React.FC<AccountEditorModalProps> = ({
  account,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !account) return null;

  const [cash, setCash] = useState<number>(account.cash || 0);
  const [holdings, setHoldings] = useState<Holding[]>([...account.holdings]);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [newAvgPrice, setNewAvgPrice] = useState<number>(10000);
  const [showAddForm, setShowAddForm] = useState(false);

  // 추가 매수 평단가 자동 계산기 상태
  const [calcOpenIdx, setCalcOpenIdx] = useState<number | null>(null);
  const [addBuyQty, setAddBuyQty] = useState<number>(1);
  const [addBuyPrice, setAddBuyPrice] = useState<number>(0);

  const handleOpenCalculator = (idx: number) => {
    if (calcOpenIdx === idx) {
      setCalcOpenIdx(null);
      return;
    }
    setCalcOpenIdx(idx);
    setAddBuyQty(1);
    setAddBuyPrice(holdings[idx].avgPrice || 10000);
  };

  const handleApplyAddBuy = (idx: number) => {
    const current = holdings[idx];
    const addedQty = Number(addBuyQty) || 0;
    const addedPrice = Number(addBuyPrice) || 0;

    if (addedQty <= 0 || addedPrice <= 0) {
      alert('추가 매수 수량과 매수 단가를 올바르게 입력해주세요.');
      return;
    }

    const totalQty = current.quantity + addedQty;
    const totalCost =
      current.quantity * current.avgPrice + addedQty * addedPrice;
    const newAvg = Math.round(totalCost / totalQty);

    const updated = [...holdings];
    updated[idx] = {
      ...current,
      quantity: totalQty,
      avgPrice: newAvg,
    };
    setHoldings(updated);
    setCalcOpenIdx(null);
  };

  const handleMoveHolding = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= holdings.length) return;
    const updated = [...holdings];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setHoldings(updated);
    if (calcOpenIdx === index) setCalcOpenIdx(targetIdx);
    else if (calcOpenIdx === targetIdx) setCalcOpenIdx(index);
  };

  const handleUpdateHolding = (
    index: number,
    field: 'quantity' | 'avgPrice',
    value: number
  ) => {
    const updated = [...holdings];
    updated[index] = {
      ...updated[index],
      [field]: isNaN(value) ? 0 : value,
    };
    setHoldings(updated);
  };

  const handleRemoveHolding = (index: number) => {
    if (confirm(`'${holdings[index].name}' 종목을 계좌에서 삭제하시겠습니까?`)) {
      setHoldings(holdings.filter((_, i) => i !== index));
      if (calcOpenIdx === index) setCalcOpenIdx(null);
    }
  };

  const handleAddHolding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      alert('종목코드와 종목명을 입력해주세요.');
      return;
    }

    setHoldings([
      ...holdings,
      {
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        quantity: Number(newQuantity) || 0,
        avgPrice: Number(newAvgPrice) || 0,
      },
    ]);

    setNewCode('');
    setNewName('');
    setNewQuantity(1);
    setNewAvgPrice(10000);
    setShowAddForm(false);
  };

  const handleSaveAll = () => {
    onSave({
      ...account,
      cash: Number(cash) || 0,
      holdings,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>✏️ 계좌 포트폴리오 수정</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                {account.owner}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              보유 수량·평단가 수정, 추가매수 자동 계산 및 종목 순서 변경이 가능합니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Cash Input */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              확인 예수금 (원)
            </label>
            <input
              type="number"
              value={cash}
              onChange={(e) => setCash(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
              placeholder="0"
            />
          </div>

          {/* Holdings List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-300">
                보유 종목 목록 ({holdings.length}종목)
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddForm ? '추가 닫기' : '신규 종목 추가'}</span>
              </button>
            </div>

            {/* Add Holding Subform */}
            {showAddForm && (
              <form
                onSubmit={handleAddHolding}
                className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-3.5 mb-3 space-y-3"
              >
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">종목명</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="예: TIGER 200"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">
                      종목코드 (6자리)
                    </label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="예: 102110"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white uppercase font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">수량 (주)</label>
                    <input
                      type="number"
                      min="1"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">평균단가 (원)</label>
                    <input
                      type="number"
                      min="1"
                      value={newAvgPrice}
                      onChange={(e) => setNewAvgPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-all"
                >
                  종목 추가 완료
                </button>
              </form>
            )}

            {/* Holdings Table */}
            <div className="space-y-2.5">
              {holdings.map((h, idx) => {
                const isCalcOpen = calcOpenIdx === idx;
                const previewTotalQty = h.quantity + (Number(addBuyQty) || 0);
                const previewNewAvg =
                  previewTotalQty > 0
                    ? Math.round(
                        (h.quantity * h.avgPrice +
                          (Number(addBuyQty) || 0) * (Number(addBuyPrice) || 0)) /
                          previewTotalQty
                      )
                    : h.avgPrice;

                return (
                  <div
                    key={h.code}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-[150px]">
                        {/* Up/Down Reorder Buttons */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveHolding(idx, 'up')}
                            disabled={idx === 0}
                            className="p-0.5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-20"
                            title="위로 이동"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveHolding(idx, 'down')}
                            disabled={idx === holdings.length - 1}
                            className="p-0.5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-20"
                            title="아래로 이동"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-white">
                            {h.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {h.code}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                        <div>
                          <label className="text-[10px] text-slate-500 block">
                            수량(주)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={h.quantity}
                            onChange={(e) =>
                              handleUpdateHolding(
                                idx,
                                'quantity',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-right font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block">
                            평균단가(원)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={h.avgPrice}
                            onChange={(e) =>
                              handleUpdateHolding(
                                idx,
                                'avgPrice',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-right font-medium"
                          />
                        </div>

                        {/* 추가매수 평단가 계산기 토글 버튼 */}
                        <button
                          type="button"
                          onClick={() => handleOpenCalculator(idx)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all mt-3 sm:mt-0 ${
                            isCalcOpen
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'bg-slate-900 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10'
                          }`}
                          title="추가 매수 시 평단가 자동 계산"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          <span>추가매수</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveHolding(idx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors mt-3 sm:mt-0"
                          title="종목 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 추가 매수 평단가 자동 계산기 패널 */}
                    {isCalcOpen && (
                      <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3 pt-2.5 text-xs space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-indigo-300 font-semibold">
                          <span>🧮 추가 매수 평단가 자동 계산기</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            기존: {h.quantity}주 × {h.avgPrice.toLocaleString('ko-KR')}원
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                          <div>
                            <label className="text-[11px] text-slate-300 block mb-1">
                              추가 매수 수량 (주)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={addBuyQty}
                              onChange={(e) =>
                                setAddBuyQty(parseInt(e.target.value) || 0)
                              }
                              className="w-full bg-slate-900 border border-indigo-500/40 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-300 block mb-1">
                              추가 매수 단가 (원)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={addBuyPrice}
                              onChange={(e) =>
                                setAddBuyPrice(parseFloat(e.target.value) || 0)
                              }
                              className="w-full bg-slate-900 border border-indigo-500/40 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApplyAddBuy(idx)}
                            className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center gap-1 transition-all shadow"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>합산 반영</span>
                          </button>
                        </div>

                        {/* 실시간 미리보기 */}
                        <div className="flex items-center justify-between pt-2 border-t border-indigo-500/20 text-[11px]">
                          <span className="text-slate-400">합산 후 예상 결과:</span>
                          <div className="font-bold text-emerald-400">
                            총 {previewTotalQty.toLocaleString('ko-KR')}주 · 새 평단가{' '}
                            {previewNewAvg.toLocaleString('ko-KR')}원
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>수정 내용 저장</span>
          </button>
        </div>
      </div>
    </div>
  );
};
