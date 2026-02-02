"use client";

import { useState } from "react";
import { updateMonthlyBudget } from "@/lib/monthly-budget-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, Target } from "lucide-react";
import { Label } from "@/components/ui/label";

interface BudgetClientProps {
  currentBudget: number;
  year: number;
  month: number;
}

export function BudgetClient({
  currentBudget,
  year,
  month,
}: BudgetClientProps) {
  const [budgetAmount, setBudgetAmount] = useState<string>(
    currentBudget > 0 ? currentBudget.toString() : "",
  );
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!budgetAmount || Number(budgetAmount) < 0) {
      toast.error("올바른 금액을 입력해주세요");
      return;
    }

    setIsSaving(true);
    const result = await updateMonthlyBudget(year, month, Number(budgetAmount));
    setIsSaving(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("예산이 저장되었습니다 ✨");
    }
  }

  return (
    <div className="space-y-8">
      {/* Summary Card */}
      <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] text-white shadow-lg shadow-indigo-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-6 w-6 text-white/80" />
          <p className="text-white/80 text-sm font-medium">
            {year}년 {month}월 예산
          </p>
        </div>
        <h2 className="text-4xl font-black tracking-tight">
          ₩ {Number(budgetAmount || 0).toLocaleString()}
        </h2>
      </div>

      {/* Budget Input */}
      <div className="space-y-6 bg-white/40 rounded-[2rem] p-6 border border-white/60 shadow-sm">
        <div className="space-y-3">
          <Label className="font-bold text-text-main text-lg flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            이번 달 총 예산
          </Label>
          <p className="text-sm text-text-secondary leading-relaxed">
            이번 달 사용할 수 있는 전체 금액을 설정해주세요.
            <br />
            대시보드에서 실시간으로 지출 현황을 확인할 수 있습니다.
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-2xl">
              ₩
            </span>
            <Input
              type="number"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="0"
              className="pl-12 text-3xl font-black rounded-3xl border-gray-200 bg-white h-24 shadow-inner focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || !budgetAmount}
            className="w-full h-16 rounded-2xl font-bold bg-gradient-to-tr from-primary-dark to-primary text-white text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 border-none"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                예산 저장하기
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-6 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
            <span className="text-xl">💡</span>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-text-main">예산 활용 팁</p>
            <ul className="text-sm text-text-secondary space-y-1 leading-relaxed">
              <li>• 고정 지출(월세, 통신비 등)을 먼저 계산해보세요</li>
              <li>• 저축 목표 금액을 미리 빼고 설정하는 것을 추천합니다</li>
              <li>• 예산은 언제든지 수정할 수 있어요</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
