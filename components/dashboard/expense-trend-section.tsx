"use client";

import { useState } from "react";
import AssetTrendChart from "@/components/charts/asset-trend-chart";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendDataPoint {
  date: string;
  label: string;
  value: number;
}

interface ExpenseTrendSectionProps {
  expenseData: TrendDataPoint[];
  incomeData: TrendDataPoint[];
}

export default function ExpenseTrendSection({
  expenseData,
  incomeData,
}: ExpenseTrendSectionProps) {
  const [mode, setMode] = useState<"expense" | "income">("expense");

  if (expenseData.length < 2 && incomeData.length < 2) {
    return null;
  }

  const currentData = mode === "expense" ? expenseData : incomeData;

  return (
    <section className="px-6 mb-8">
      <div className="flex items-center justify-between mb-5 pl-1">
        <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
          {mode === "expense" ? "지출 추이" : "수입 추이"}{" "}
          {mode === "expense" ? (
            <TrendingDown className="w-5 h-5 text-primary" />
          ) : (
            <TrendingUp className="w-5 h-5 text-green-500" />
          )}
        </h3>

        <div className="flex bg-white/60 p-1 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm">
          <button
            onClick={() => setMode("expense")}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded-lg transition-all",
              mode === "expense"
                ? "bg-white shadow-sm text-primary"
                : "text-text-secondary hover:text-text-main",
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
                : "text-text-secondary hover:text-text-main",
            )}
          >
            수입
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-[2rem] p-5 shadow-glass border border-white/60">
        <AssetTrendChart data={currentData} />
      </div>
    </section>
  );
}
