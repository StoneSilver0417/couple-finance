"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TransactionItem {
  id: string;
  amount: number;
  memo: string | null;
  transaction_date: string;
  type?: "income" | "expense";
  // RPC 평탄화 결과 (category_*)와 일반 조인 결과 (categories) 양쪽 모두 지원
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  categories?: {
    name: string;
    icon: string;
    color: string;
  } | null;
}

interface CategoryTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  transactions: TransactionItem[];
  type: "expense" | "income";
}

export function CategoryTransactionsModal({
  isOpen,
  onClose,
  categoryName,
  categoryIcon,
  categoryColor,
  transactions,
  type,
}: CategoryTransactionsModalProps) {
  if (!isOpen) return null;

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative w-full max-w-md bg-white rounded-t-[2rem] shadow-2xl animate-slide-up max-h-[80vh] min-h-[280px] flex flex-col">
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${categoryColor}20` }}
            >
              {categoryIcon || (type === "expense" ? "💸" : "💰")}
            </div>
            <div>
              <h2 className="text-lg font-black text-text-main">{categoryName}</h2>
              <p className="text-sm text-text-secondary">
                {transactions.length}건 ·{" "}
                <span className={type === "expense" ? "text-rose-500" : "text-emerald-600"}>
                  {type === "expense" ? "-" : "+"}₩{total.toLocaleString()}
                </span>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 거래 목록 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[120px]">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              거래 내역이 없습니다
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-main truncate">
                      {tx.memo || categoryName}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {new Date(tx.transaction_date).toLocaleDateString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      type === "expense" ? "text-rose-500" : "text-emerald-600"
                    }`}
                  >
                    {type === "expense" ? "-" : "+"}₩{tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 safe area - 네비게이션 바 높이 고려 */}
        <div className="shrink-0" style={{ height: 'calc(100px + env(safe-area-inset-bottom, 0px))' }} />
      </div>
    </div>
  );
}
