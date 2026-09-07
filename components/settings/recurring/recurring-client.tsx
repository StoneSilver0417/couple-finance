"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Info } from "lucide-react";
import type { Category, RecurringRule } from "@/types";
import { RecurringRuleCard } from "./recurring-rule-card";
import { RecurringRuleDialog } from "./recurring-rule-dialog";
import { toast } from "sonner";
import { materializeMonthlyRecurringTransactions } from "@/lib/recurring-actions";

export type RecurringRuleWithCategory = RecurringRule & {
  categories?: {
    name: string;
    icon: string;
    color: string;
  };
};

interface RecurringClientProps {
  rules: RecurringRuleWithCategory[];
  categories: Category[];
  error?: string;
}

export function RecurringClient({ rules, categories, error }: RecurringClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRuleWithCategory | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const openCreateDialog = () => {
    setEditingRule(null);
    setDialogOpen(true);
  };

  const openEditDialog = (rule: RecurringRuleWithCategory) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      const result = await materializeMonthlyRecurringTransactions(year, month);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`이번 달 반복 거래 ${result.processed_count}건이 동기화되었습니다.`);
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("동기화 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-destructive font-bold mb-2">데이터를 불러오지 못했습니다</p>
        <p className="text-sm text-text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex min-w-0 items-center justify-between gap-4 px-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-2xl font-black text-text-main tracking-tighter flex items-center gap-2">
            반복 거래 목록
          </h3>
          <p className="mt-1 text-xs font-semibold text-text-secondary">
            매달 자동으로 기록할 거래를 관리합니다
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          size="icon"
          aria-label="반복 거래 추가"
          className="h-12 w-12 shrink-0 rounded-full border border-white/60 bg-white text-primary shadow-soft transition-colors hover:bg-white/80"
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center justify-center min-h-[200px]">
            <p className="text-text-secondary font-medium mb-4">등록된 반복 거래가 없습니다.</p>
            <Button onClick={openCreateDialog} variant="outline" className="h-11 rounded-2xl">
              첫 반복 거래 추가하기
            </Button>
          </div>
        ) : (
          rules.map((rule) => (
            <RecurringRuleCard
              key={rule.id}
              rule={rule}
              onEdit={openEditDialog}
            />
          ))
        )}
      </div>

      <div className="space-y-4 rounded-3xl border border-white/40 bg-white/30 p-6 shadow-soft">
        <p className="text-sm text-text-secondary font-medium flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span><strong>안내:</strong> 반복 거래는 해당 월의 가계부를 열 때 자동으로 내역에 추가됩니다. 즉시 반영이 필요하다면 아래 버튼을 눌러주세요.</span>
        </p>
        <Button 
          onClick={handleManualSync} 
          disabled={isSyncing}
          variant="outline" 
          className="h-11 w-full rounded-2xl font-bold"
        >
          {isSyncing ? "동기화 중..." : "이번 달 내역에 즉시 반영"}
        </Button>
      </div>

      <RecurringRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editingRule}
        categories={categories}
      />
    </div>
  );
}
