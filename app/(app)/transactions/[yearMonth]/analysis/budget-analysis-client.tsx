"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import { CategoryTransactionsModal } from "@/components/dashboard/category-transactions-modal";

interface AnalysisData {
  income: number;
  fixedExpense: number;
  variableExpense: number;
  irregularExpense: number;
  totalExpense: number;
  balance: number;
}

interface TransactionItem {
  id: string;
  type: string;
  expense_type: string | null;
  amount: number;
  memo: string | null;
  transaction_date: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

interface BudgetAnalysisClientProps {
  data: AnalysisData;
  transactions?: TransactionItem[];
}

type ExpenseType = "income" | "fixed" | "variable" | "irregular";

// 금액 포맷팅 함수
function formatAmount(amount: number): string {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만`;
  }
  return amount.toLocaleString();
}

function formatFullAmount(amount: number): string {
  return `₩${amount.toLocaleString()}`;
}

export function BudgetAnalysisClient({ data, transactions = [] }: BudgetAnalysisClientProps) {
  const [selectedType, setSelectedType] = useState<ExpenseType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const chartData = [
    {
      name: "수입",
      value: data.income,
      color: "#6366f1", // indigo
    },
    {
      name: "고정지출",
      value: data.fixedExpense,
      color: "#f43f5e", // rose
    },
    {
      name: "변동지출",
      value: data.variableExpense,
      color: "#f97316", // orange
    },
    {
      name: "비정기지출",
      value: data.irregularExpense,
      color: "#a855f7", // purple
    },
  ];

  const maxValue = Math.max(...chartData.map((d) => d.value));

  const handleItemClick = (type: ExpenseType) => {
    setSelectedType(type);
    setIsModalOpen(true);
  };

  // 선택된 타입에 따른 거래 필터링
  const getFilteredTransactions = () => {
    if (!selectedType) return [];

    if (selectedType === "income") {
      return transactions.filter((t) => t.type === "income");
    }
    return transactions.filter(
      (t) => t.type === "expense" && t.expense_type === selectedType
    );
  };

  const getModalTitle = () => {
    switch (selectedType) {
      case "income":
        return "수입";
      case "fixed":
        return "고정지출";
      case "variable":
        return "변동지출";
      case "irregular":
        return "비정기지출";
      default:
        return "";
    }
  };

  const getModalIcon = () => {
    switch (selectedType) {
      case "income":
        return "💰";
      case "fixed":
        return "🏠";
      case "variable":
        return "🛒";
      case "irregular":
        return "🎁";
      default:
        return "💸";
    }
  };

  const getModalColor = () => {
    switch (selectedType) {
      case "income":
        return "#6366f1";
      case "fixed":
        return "#f43f5e";
      case "variable":
        return "#f97316";
      case "irregular":
        return "#a855f7";
      default:
        return "#6366f1";
    }
  };

  const filteredTransactions = getFilteredTransactions().map((t) => ({
    id: t.id,
    amount: t.amount,
    memo: t.memo,
    transaction_date: t.transaction_date,
    category_name: t.category_name,
    category_icon: t.category_icon,
    category_color: t.category_color,
  }));

  return (
    <div className="space-y-6">
      {/* 요약 테이블 */}
      <div className="glass-panel w-full rounded-[2rem] p-5 shadow-glass border border-white/60">
        <h2 className="text-base font-black text-text-main mb-4 flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-primary" />
          항목별 예산 실적
        </h2>

        <div className="space-y-3">
          {/* 수입 */}
          <button
            onClick={() => handleItemClick("income")}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 hover:bg-indigo-100/70 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
              <span className="font-bold text-text-main">수입</span>
            </div>
            <span className="font-black text-lg text-indigo-600">
              {formatFullAmount(data.income)}
            </span>
          </button>

          {/* 고정지출 */}
          <button
            onClick={() => handleItemClick("fixed")}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-50/70 border border-rose-100 hover:bg-rose-100/70 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <span className="text-lg">🏠</span>
              </div>
              <div>
                <span className="font-bold text-text-main">고정지출</span>
                <p className="text-xs text-text-secondary">월세, 보험, 구독료 등</p>
              </div>
            </div>
            <span className="font-black text-lg text-rose-600">
              {formatFullAmount(data.fixedExpense)}
            </span>
          </button>

          {/* 변동지출 */}
          <button
            onClick={() => handleItemClick("variable")}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-orange-50/70 border border-orange-100 hover:bg-orange-100/70 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-lg">🛒</span>
              </div>
              <div>
                <span className="font-bold text-text-main">변동지출</span>
                <p className="text-xs text-text-secondary">식비, 교통비, 생활비 등</p>
              </div>
            </div>
            <span className="font-black text-lg text-orange-600">
              {formatFullAmount(data.variableExpense)}
            </span>
          </button>

          {/* 비정기지출 */}
          <button
            onClick={() => handleItemClick("irregular")}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-50/70 border border-purple-100 hover:bg-purple-100/70 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-lg">🎁</span>
              </div>
              <div>
                <span className="font-bold text-text-main">비정기지출</span>
                <p className="text-xs text-text-secondary">경조사, 여행, 큰 구매 등</p>
              </div>
            </div>
            <span className="font-black text-lg text-purple-600">
              {formatFullAmount(data.irregularExpense)}
            </span>
          </button>

          {/* 구분선 */}
          <div className="border-t border-gray-200 my-2" />

          {/* 총 지출 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-gray-600" />
              </div>
              <span className="font-bold text-text-main">총 지출</span>
            </div>
            <span className="font-black text-lg text-gray-700">
              {formatFullAmount(data.totalExpense)}
            </span>
          </div>

          {/* 잔액 */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl border ${
              data.balance >= 0
                ? "bg-emerald-50/70 border-emerald-200"
                : "bg-red-50/70 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  data.balance >= 0 ? "bg-emerald-100" : "bg-red-100"
                }`}
              >
                <Wallet
                  className={`h-5 w-5 ${
                    data.balance >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                />
              </div>
              <span className="font-bold text-text-main">이번 달 잔액</span>
            </div>
            <span
              className={`font-black text-lg ${
                data.balance >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {data.balance >= 0 ? "+" : ""}
              {formatFullAmount(data.balance)}
            </span>
          </div>
        </div>
      </div>

      {/* 막대 그래프 */}
      <div className="glass-panel w-full rounded-[2rem] p-5 shadow-glass border border-white/60">
        <h2 className="text-base font-black text-text-main mb-4 flex items-center gap-2">
          📊 항목별 비교
        </h2>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
            >
              <XAxis type="number" hide domain={[0, maxValue * 1.2]} />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 13, fontWeight: 700, fill: "#374151" }}
                width={80}
              />
              <Bar
                dataKey="value"
                radius={[0, 12, 12, 0]}
                barSize={36}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(value: number) => formatAmount(value)}
                  style={{ fontSize: 13, fontWeight: 700, fill: "#374151" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 지출 비율 */}
      {data.totalExpense > 0 && (
        <div className="glass-panel w-full rounded-[2rem] p-5 shadow-glass border border-white/60">
          <h2 className="text-base font-black text-text-main mb-4 flex items-center gap-2">
            📈 지출 비율
          </h2>

          <div className="space-y-4">
            {/* 고정지출 비율 */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold text-text-secondary">고정지출</span>
                <span className="text-sm font-bold text-rose-600">
                  {((data.fixedExpense / data.totalExpense) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${(data.fixedExpense / data.totalExpense) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* 변동지출 비율 */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold text-text-secondary">변동지출</span>
                <span className="text-sm font-bold text-orange-600">
                  {((data.variableExpense / data.totalExpense) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${(data.variableExpense / data.totalExpense) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* 비정기지출 비율 */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold text-text-secondary">비정기지출</span>
                <span className="text-sm font-bold text-purple-600">
                  {((data.irregularExpense / data.totalExpense) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${(data.irregularExpense / data.totalExpense) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 거래 내역 모달 */}
      <CategoryTransactionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryName={getModalTitle()}
        categoryIcon={getModalIcon()}
        categoryColor={getModalColor()}
        transactions={filteredTransactions}
        type={selectedType === "income" ? "income" : "expense"}
      />
    </div>
  );
}
