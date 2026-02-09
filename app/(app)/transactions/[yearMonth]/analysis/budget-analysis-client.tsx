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

export function BudgetAnalysisClient({
  data,
  transactions = [],
}: BudgetAnalysisClientProps) {
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
      (t) => t.type === "expense" && t.expense_type === selectedType,
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
            className="w-full flex items-center justify-between p-3 rounded-2xl border shadow-sm hover:opacity-90 transition-all"
            style={{
              backgroundColor: "#6366f115",
              borderColor: "#6366f130",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: "#6366f130" }}
              >
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-600">수입</p>
                <p className="text-sm font-black text-text-main">
                  {data.income >= 100000000
                    ? `${(data.income / 100000000).toFixed(1)}억`
                    : `${(data.income / 10000).toFixed(0)}만원`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100/50 text-indigo-600">
                100%
              </span>
            </div>
          </button>

          {/* 고정지출 */}
          <button
            onClick={() => handleItemClick("fixed")}
            className="w-full flex items-center justify-between p-3 rounded-2xl border shadow-sm hover:opacity-90 transition-all"
            style={{
              backgroundColor: "#f43f5e15",
              borderColor: "#f43f5e30",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: "#f43f5e30" }}
              >
                <span className="text-lg">🏠</span>
              </div>
              <div>
                <p className="text-xs font-bold text-rose-600">고정지출</p>
                <p className="text-sm font-black text-text-main">
                  {data.fixedExpense >= 100000000
                    ? `${(data.fixedExpense / 100000000).toFixed(1)}억`
                    : `${(data.fixedExpense / 10000).toFixed(0)}만원`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-rose-100/50 text-rose-600">
                {data.totalExpense > 0
                  ? ((data.fixedExpense / data.totalExpense) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </button>

          {/* 변동지출 */}
          <button
            onClick={() => handleItemClick("variable")}
            className="w-full flex items-center justify-between p-3 rounded-2xl border shadow-sm hover:opacity-90 transition-all"
            style={{
              backgroundColor: "#f9731615",
              borderColor: "#f9731630",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: "#f9731630" }}
              >
                <span className="text-lg">🛒</span>
              </div>
              <div>
                <p className="text-xs font-bold text-orange-600">변동지출</p>
                <p className="text-sm font-black text-text-main">
                  {data.variableExpense >= 100000000
                    ? `${(data.variableExpense / 100000000).toFixed(1)}억`
                    : `${(data.variableExpense / 10000).toFixed(0)}만원`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-100/50 text-orange-600">
                {data.totalExpense > 0
                  ? ((data.variableExpense / data.totalExpense) * 100).toFixed(
                      1,
                    )
                  : 0}
                %
              </span>
            </div>
          </button>

          {/* 비정기지출 */}
          <button
            onClick={() => handleItemClick("irregular")}
            className="w-full flex items-center justify-between p-3 rounded-2xl border shadow-sm hover:opacity-90 transition-all"
            style={{
              backgroundColor: "#a855f715",
              borderColor: "#a855f730",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: "#a855f730" }}
              >
                <span className="text-lg">🎁</span>
              </div>
              <div>
                <p className="text-xs font-bold text-purple-600">비정기지출</p>
                <p className="text-sm font-black text-text-main">
                  {data.irregularExpense >= 100000000
                    ? `${(data.irregularExpense / 100000000).toFixed(1)}억`
                    : `${(data.irregularExpense / 10000).toFixed(0)}만원`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-100/50 text-purple-600">
                {data.totalExpense > 0
                  ? ((data.irregularExpense / data.totalExpense) * 100).toFixed(
                      1,
                    )
                  : 0}
                %
              </span>
            </div>
          </button>

          {/* 구분선 */}
          <div className="border-t border-gray-100 my-2" />

          {/* 총 지출 */}
          <div className="flex items-center justify-between p-3 rounded-2xl border shadow-sm bg-gray-50/50 border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center shadow-sm">
                <TrendingDown className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500">총 지출</p>
                <p className="text-sm font-black text-text-main">
                  {data.totalExpense >= 100000000
                    ? `${(data.totalExpense / 100000000).toFixed(1)}억`
                    : `${(data.totalExpense / 10000).toFixed(0)}만원`}
                </p>
              </div>
            </div>
          </div>

          {/* 잔액 */}
          <div
            className={`flex items-center justify-between p-3 rounded-2xl border shadow-sm ${
              data.balance >= 0
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-red-50/50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                  data.balance >= 0 ? "bg-emerald-100" : "bg-red-100"
                }`}
              >
                <Wallet
                  className={`h-5 w-5 ${
                    data.balance >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                />
              </div>
              <div>
                <p
                  className={`text-xs font-bold ${data.balance >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  이번 달 잔액
                </p>
                <p className="text-sm font-black text-text-main">
                  {data.balance >= 0 ? "+" : "-"}
                  {Math.abs(data.balance) >= 100000000
                    ? `${(Math.abs(data.balance) / 100000000).toFixed(1)}억`
                    : `${(Math.abs(data.balance) / 10000).toFixed(0)}만원`}
                </p>
              </div>
            </div>
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
                  formatter={(value: any) => formatAmount(Number(value))}
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
                <span className="text-sm font-semibold text-text-secondary">
                  고정지출
                </span>
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
                <span className="text-sm font-semibold text-text-secondary">
                  변동지출
                </span>
                <span className="text-sm font-bold text-orange-600">
                  {((data.variableExpense / data.totalExpense) * 100).toFixed(
                    1,
                  )}
                  %
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
                <span className="text-sm font-semibold text-text-secondary">
                  비정기지출
                </span>
                <span className="text-sm font-bold text-purple-600">
                  {((data.irregularExpense / data.totalExpense) * 100).toFixed(
                    1,
                  )}
                  %
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
