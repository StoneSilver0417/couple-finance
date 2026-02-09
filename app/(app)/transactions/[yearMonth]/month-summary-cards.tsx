"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, ChevronDown } from "lucide-react";
import {
  CategoryTransactionsModal,
  TransactionItem,
} from "@/components/dashboard/category-transactions-modal";

interface CategoryData {
  name: string;
  value: number;
  color: string;
  icon?: string;
}

interface MonthSummaryCardsProps {
  summary: {
    income: number;
    expense: number;
    balance: number;
  };
  transactions: TransactionItem[];
}

export default function MonthSummaryCards({
  summary,
  transactions,
}: MonthSummaryCardsProps) {
  const [expandedType, setExpandedType] = useState<"income" | "expense" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 카테고리별 그룹핑
  const incomeByCategory = useMemo(() => {
    const groups: Record<string, CategoryData> = {};
    transactions
      .filter((tx: any) => tx.type === "income")
      .forEach((tx: any) => {
        const name = tx.category_name || tx.categories?.name || "미분류";
        const color = tx.category_color || tx.categories?.color || "#10B981";
        const icon = tx.category_icon || tx.categories?.icon || "💰";
        if (!groups[name]) groups[name] = { name, value: 0, color, icon };
        groups[name].value += Number(tx.amount);
      });
    return Object.values(groups).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const groups: Record<string, CategoryData> = {};
    transactions
      .filter((tx: any) => tx.type === "expense")
      .forEach((tx: any) => {
        const name = tx.category_name || tx.categories?.name || "미분류";
        const color = tx.category_color || tx.categories?.color || "#EF4444";
        const icon = tx.category_icon || tx.categories?.icon || "💸";
        if (!groups[name]) groups[name] = { name, value: 0, color, icon };
        groups[name].value += Number(tx.amount);
      });
    return Object.values(groups).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const handleCardClick = (type: "income" | "expense") => {
    setExpandedType((prev) => (prev === type ? null : type));
  };

  const handleCategoryClick = (cat: CategoryData, type: "income" | "expense") => {
    setSelectedCategory(cat);
    setIsModalOpen(true);
  };

  const activeCategories = expandedType === "income" ? incomeByCategory : expenseByCategory;
  const activeTotal = expandedType === "income" ? summary.income : summary.expense;

  // 모달용 거래 필터링
  const filteredTransactions = selectedCategory
    ? transactions.filter(
        (tx: any) =>
          (tx.category_name || tx.categories?.name) === selectedCategory.name
      )
    : [];

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {/* 수입 카드 */}
        <button
          onClick={() => handleCardClick("income")}
          className={`glass-panel p-4 rounded-[1.5rem] flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-200 ${
            expandedType === "income"
              ? "bg-indigo-100/70 ring-2 ring-indigo-300"
              : "bg-indigo-50/50 hover:bg-indigo-100/50"
          }`}
        >
          <div className="absolute top-0 right-0 w-10 h-10 bg-indigo-200/30 rounded-full blur-xl" />
          <span className="text-[10px] font-bold text-indigo-400 mb-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> 수입
          </span>
          <span className="text-sm font-black text-text-main leading-tight">
            {(summary.income / 10000).toFixed(0)}만
          </span>
          <ChevronDown
            className={`h-3 w-3 text-indigo-400 mt-1 transition-transform duration-200 ${
              expandedType === "income" ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* 지출 카드 */}
        <button
          onClick={() => handleCardClick("expense")}
          className={`glass-panel p-4 rounded-[1.5rem] flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-200 ${
            expandedType === "expense"
              ? "bg-pink-100/70 ring-2 ring-pink-300"
              : "bg-pink-50/50 hover:bg-pink-100/50"
          }`}
        >
          <div className="absolute top-0 right-0 w-10 h-10 bg-pink-200/30 rounded-full blur-xl" />
          <span className="text-[10px] font-bold text-pink-400 mb-1 flex items-center gap-1">
            <TrendingDown className="h-3 w-3" /> 지출
          </span>
          <span className="text-sm font-black text-text-main leading-tight">
            {(summary.expense / 10000).toFixed(0)}만
          </span>
          <ChevronDown
            className={`h-3 w-3 text-pink-400 mt-1 transition-transform duration-200 ${
              expandedType === "expense" ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* 잔액 카드 */}
        <div className="glass-panel p-4 rounded-[1.5rem] flex flex-col items-center justify-center text-center bg-emerald-50/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-10 h-10 bg-emerald-200/30 rounded-full blur-xl" />
          <span className="text-[10px] font-bold text-emerald-500 mb-1 flex items-center gap-1">
            <Wallet className="h-3 w-3" /> 잔액
          </span>
          <span
            className={`text-sm font-black leading-tight ${
              summary.balance >= 0 ? "text-emerald-600" : "text-rose-500"
            }`}
          >
            {(summary.balance / 10000).toFixed(0)}만
          </span>
          {/* 잔액 카드에는 화살표 없음 */}
          <div className="h-3 mt-1" />
        </div>
      </div>

      {/* 카테고리 상세 펼침 영역 */}
      <AnimatePresence>
        {expandedType && activeCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="glass-panel rounded-[1.5rem] p-4 border border-white/60">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1 mb-3">
                {expandedType === "income" ? "수입" : "지출"} 카테고리별 내역
              </p>

              <div className="space-y-2">
                {activeCategories.map((cat) => {
                  const percent = activeTotal > 0 ? (cat.value / activeTotal) * 100 : 0;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => handleCategoryClick(cat, expandedType)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left hover:opacity-80"
                      style={{ backgroundColor: cat.color ? `${cat.color}12` : "#f9fafb" }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ backgroundColor: cat.color ? `${cat.color}25` : "#f3f4f6" }}
                      >
                        {cat.icon || (expandedType === "income" ? "💰" : "💸")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-text-main truncate">
                            {cat.name}
                          </span>
                          <span className="text-xs font-black text-text-main shrink-0 ml-2">
                            {cat.value >= 100000000
                              ? `${(cat.value / 100000000).toFixed(1)}억`
                              : `${(cat.value / 10000).toFixed(1)}만`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percent}%`,
                                backgroundColor: cat.color || "#6366f1",
                              }}
                            />
                          </div>
                          <span
                            className="text-[10px] font-bold shrink-0"
                            style={{ color: cat.color || "#6366f1" }}
                          >
                            {percent.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 카테고리 거래 내역 모달 */}
      <CategoryTransactionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryName={selectedCategory?.name || ""}
        categoryIcon={selectedCategory?.icon}
        categoryColor={selectedCategory?.color}
        transactions={filteredTransactions}
        type={expandedType || "expense"}
      />
    </>
  );
}
