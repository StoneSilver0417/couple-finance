"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Calendar, CircleDollarSign } from "lucide-react";
import { toggleRecurringRule, deleteRecurringRule } from "@/lib/recurring-actions";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { RecurringRuleWithCategory } from "./recurring-client";

interface RecurringRuleCardProps {
  rule: RecurringRuleWithCategory;
  onEdit: (rule: RecurringRuleWithCategory) => void;
}

export function RecurringRuleCard({ rule, onEdit }: RecurringRuleCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const confirm = useConfirm();

  const handleToggle = async () => {
    setIsToggling(true);
    const newState = !rule.is_active;
    try {
      const result = await toggleRecurringRule(rule.id, newState);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`반복 거래가 ${newState ? "활성화" : "비활성화"}되었습니다.`);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("상태 변경 중 오류가 발생했습니다.");
      }
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "반복 거래 삭제",
      message: "이 반복 거래 규칙을 삭제하시겠습니까? 이미 생성된 내역은 삭제되지 않습니다.",
      confirmText: "삭제하기",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      const result = await deleteRecurringRule(rule.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("반복 거래가 삭제되었습니다.");
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const isIncome = rule.type === "income";
  const amountColor = isIncome ? "text-green-600" : "text-text-main";
  const amountPrefix = isIncome ? "+" : "-";
  const formattedAmount = Math.round(rule.amount).toLocaleString("ko-KR");

  return (
    <div className={`glass-panel rounded-3xl p-5 ${!rule.is_active ? "border-dashed" : ""}`}>
      <div className="mb-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-2xl shadow-sm"
            style={rule.categories?.color ? { backgroundColor: `${rule.categories.color}20` } : undefined}
          >
            {rule.categories?.icon || (
              <CircleDollarSign className="h-6 w-6 text-text-secondary" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-bold text-text-main">
                {rule.categories?.name}
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold shrink-0 whitespace-nowrap">
                매월 {rule.target_day}일
              </span>
            </div>
            {rule.memo && (
              <p className="text-sm text-text-secondary mt-0.5 truncate">{rule.memo}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            role="switch"
            aria-checked={rule.is_active}
            onClick={handleToggle}
            disabled={isToggling}
            className="relative inline-flex h-11 w-14 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            aria-label={isToggling ? "상태 변경 중" : "활성화 상태 토글"}
          >
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rule.is_active ? "bg-primary" : "bg-gray-200"} ${isToggling ? "opacity-50" : ""}`}>
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  rule.is_active ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <p className={`text-lg font-black tracking-tight truncate ${amountColor}`}>
            {amountPrefix}₩{formattedAmount}
          </p>
          <div className="flex items-center gap-1 text-xs text-text-secondary font-medium">
            <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{rule.start_date} ~ {rule.end_date || "계속"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(rule)}
            className="h-11 w-11 rounded-full bg-white/50 hover:bg-white text-text-secondary hover:text-primary transition-colors"
            aria-label="수정"
          >
            <Edit2 className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-11 w-11 rounded-full bg-white/50 text-text-secondary transition-colors hover:text-destructive"
            aria-label="삭제"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
