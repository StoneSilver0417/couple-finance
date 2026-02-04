"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CategoryTransactionsModal,
  TransactionItem,
} from "./category-transactions-modal";

interface CategoryData {
  name: string;
  value: number;
  color: string;
  icon?: string;
}

interface AnalysisSectionProps {
  expenseData: CategoryData[];
  incomeData: CategoryData[];
  totalBudget: number;
  totalExpense: number;
  variableExpense: number;
  totalIncome: number;
  transactions?: TransactionItem[];
}

export default function AnalysisSection({
  expenseData,
  incomeData,
  totalBudget,
  totalExpense,
  variableExpense,
  totalIncome,
  transactions = [],
}: AnalysisSectionProps) {
  const [mode, setMode] = useState<"expense" | "income">("expense");
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 예산 잔액은 변동지출만 차감
  const budgetRemaining = totalBudget - variableExpense;
  const budgetUsedPercent =
    totalBudget > 0 ? (variableExpense / totalBudget) * 100 : 0;

  const handleCategoryClick = (cat: CategoryData, type: "expense" | "income") => {
    setSelectedCategory(cat);
    setMode(type);
    setIsModalOpen(true);
  };

  // 선택된 카테고리의 거래 내역 필터링
  const filteredTransactions = selectedCategory
    ? transactions.filter((tx) => tx.category_name === selectedCategory.name)
    : [];

  return (
    <section className="px-6 mb-8">
      <div className="flex items-center justify-between mb-5 pl-1">
        <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
          {mode === "expense" ? "지출 분석" : "수입 분석"}{" "}
          <span className="text-xl">📊</span>
        </h3>

        <div className="flex bg-white/60 p-1 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm">
          <button
            onClick={() => setMode("expense")}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded-lg transition-all",
              mode === "expense"
                ? "bg-white shadow-sm text-primary"
                : "text-text-secondary hover:text-text-main"
            )}
          >
            지출
          </button>
          <button
            onClick={() => setMode("income")}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded-lg transition-all",
              mode === "income"
                ? "bg-white shadow-sm text-green-600"
                : "text-text-secondary hover:text-text-main"
            )}
          >
            수입
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-[2rem] p-0 shadow-glass border border-white/60 overflow-hidden relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(45,45,95,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(45,45,95,0.05)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]"></div>

        <div className="p-6 relative z-10">
          {mode === "expense" ? (
            <div className="flex flex-col gap-6">
              {/* Budget Progress */}
              <div className="flex flex-col items-center gap-6">
                <div className="relative size-40 shrink-0 flex items-center justify-center">
                  <svg
                    className="absolute inset-0 -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={budgetRemaining < 0 ? "#ef4444" : "#fb6f92"}
                      strokeWidth="10"
                      strokeDasharray={`${Math.min(budgetUsedPercent, 100) * 2.513} ${251.3 - Math.min(budgetUsedPercent, 100) * 2.513}`}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="flex flex-col items-center relative z-10">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">
                      사용률
                    </span>
                    <span
                      className={`text-3xl font-black tracking-tighter ${budgetRemaining < 0 ? "text-red-500" : "text-text-main"}`}
                    >
                      {totalBudget > 0
                        ? `${budgetUsedPercent.toFixed(0)}%`
                        : `${(totalExpense / 10000).toFixed(1)}만`}
                    </span>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-3">
                  <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-3 border border-white/60 flex flex-col items-center text-center shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-dark"></div>
                      <span className="text-[11px] font-bold text-text-secondary">
                        지출 합계
                      </span>
                    </div>
                    <span className="text-lg font-black text-text-main whitespace-nowrap">
                      {totalBudget > 0
                        ? `${budgetUsedPercent.toFixed(0)}%`
                        : "100%"}
                    </span>
                  </div>

                  {totalBudget > 0 && (
                    <div
                      className={`${budgetRemaining < 0 ? "bg-red-50/50" : "bg-green-50/50"} backdrop-blur-sm rounded-2xl p-3 border border-white/60 flex flex-col items-center text-center shadow-sm`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${budgetRemaining < 0 ? "bg-red-400" : "bg-green-400"}`}
                        ></div>
                        <span className="text-[11px] font-bold text-text-secondary">
                          예산 잔액
                        </span>
                      </div>
                      <span
                        className={`text-lg font-black whitespace-nowrap ${budgetRemaining < 0 ? "text-red-500" : "text-text-main"}`}
                      >
                        {budgetRemaining >= 0 ? "+" : ""}
                        {(budgetRemaining / 10000).toLocaleString(undefined, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                        <span className="text-xs font-bold ml-0.5">만</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Breakdown for Expense */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">
                  Top Categories
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {expenseData.slice(0, 4).map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => handleCategoryClick(cat, "expense")}
                      className="flex items-center gap-2 p-2 rounded-xl bg-gray-50/50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <span className="text-base">{cat.icon || "💸"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-text-main truncate">
                          {cat.name}
                        </p>
                        <p className="text-[10px] text-text-secondary">
                          {(cat.value / 10000).toFixed(1)}만
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Income Category Breakdown View */}
              <div className="flex items-center gap-6">
                <div className="relative size-32 shrink-0 flex items-center justify-center">
                  <svg
                    className="absolute inset-0 -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f0fdf4"
                      strokeWidth="12"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="12"
                      strokeDasharray={`${Math.min(100, 100) * 2.513} 0`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="flex flex-col items-center relative z-10">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">
                      수입
                    </span>
                    <span className="text-lg font-black text-green-600">
                      {(totalIncome / 10000).toFixed(1)}만
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  {incomeData.length > 0 ? (
                    incomeData.slice(0, 3).map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => handleCategoryClick(cat, "income")}
                        className="w-full space-y-1 text-left hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-text-main">{cat.name}</span>
                          <span className="text-green-600">
                            {totalIncome > 0
                              ? `${((cat.value / totalIncome) * 100).toFixed(0)}%`
                              : "0%"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{
                              width: `${totalIncome > 0 ? (cat.value / totalIncome) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-text-secondary text-center py-4">
                      수입 내역이 없습니다
                    </p>
                  )}
                </div>
              </div>

              {/* All Income Categories */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                {incomeData.slice(0, 4).map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => handleCategoryClick(cat, "income")}
                    className="flex items-center gap-2 p-2 rounded-xl bg-green-50/50 hover:bg-green-100 transition-colors text-left"
                  >
                    <span className="text-base">{cat.icon || "💰"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-text-main truncate">
                        {cat.name}
                      </p>
                      <p className="text-[10px] text-green-600">
                        {(cat.value / 10000).toFixed(1)}만
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 카테고리 거래 내역 모달 */}
      <CategoryTransactionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryName={selectedCategory?.name || ""}
        categoryIcon={selectedCategory?.icon}
        categoryColor={selectedCategory?.color}
        transactions={filteredTransactions}
        type={mode}
      />
    </section>
  );
}
