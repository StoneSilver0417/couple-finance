"use client";

import { useState } from "react";
import AssetPortfolioChart from "@/components/charts/asset-portfolio-chart";
import { cn } from "@/lib/utils";

interface CategoryAggregate {
  name: string;
  value: number;
  color: string;
}

interface CategoryBreakdownSectionProps {
  expenseCategories: CategoryAggregate[];
  incomeCategories: CategoryAggregate[];
}

export default function CategoryBreakdownSection({
  expenseCategories,
  incomeCategories,
}: CategoryBreakdownSectionProps) {
  const [mode, setMode] = useState<"expense" | "income">("expense");

  if (expenseCategories.length === 0 && incomeCategories.length === 0) {
    return null;
  }

  const currentData = mode === "expense" ? expenseCategories : incomeCategories;

  return (
    <div className="px-6">
      <div className="glass-panel p-5 rounded-[2rem] border border-white/60">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-lg font-bold text-text-main">
            카테고리별 {mode === "expense" ? "지출" : "수입"} 비중
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

        {currentData.length > 0 ? (
          <AssetPortfolioChart data={currentData} />
        ) : (
          <p className="py-8 text-center text-sm text-text-secondary">
            {mode === "expense" ? "지출" : "수입"} 내역이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
