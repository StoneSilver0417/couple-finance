"use client";

import { useState } from "react";
import { restoreCategory } from "@/lib/category-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

interface DeletedCategoryListProps {
  categories: any[];
}

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  fixed: "고정",
  variable: "변동",
  irregular: "비정기",
};

export function DeletedCategoryList({ categories }: DeletedCategoryListProps) {
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function handleRestore(categoryId: string) {
    setRestoringId(categoryId);
    const result = await restoreCategory(categoryId);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("카테고리가 복원되었습니다");
    }
    setRestoringId(null);
  }

  return (
    <div className="space-y-2">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/60 border border-gray-100"
        >
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center text-xl opacity-50"
            style={{
              background: `linear-gradient(135deg, ${cat.color}15 0%, ${cat.color}30 100%)`,
            }}
          >
            {cat.icon}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-secondary truncate">
              {cat.name}
            </p>
            <p className="text-[10px] text-text-secondary">
              {cat.type === "income"
                ? "수입"
                : EXPENSE_CATEGORY_LABELS[cat.expense_category] || "지출"}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRestore(cat.id)}
            disabled={restoringId === cat.id}
            className="rounded-xl text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            복원
          </Button>
        </div>
      ))}
    </div>
  );
}
