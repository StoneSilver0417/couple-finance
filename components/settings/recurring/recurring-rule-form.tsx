"use client";

import { useState } from "react";
import { createRecurringRule, updateRecurringRule } from "@/lib/recurring-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Category } from "@/types";
import type { RecurringRuleWithCategory } from "./recurring-client";

export function RecurringRuleForm({
  rule,
  categories,
  onOpenChange,
}: {
  rule?: RecurringRuleWithCategory | null;
  categories: Category[];
  onOpenChange: (open: boolean) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState<"income" | "expense">(rule?.type ?? "expense");
  const [expenseType, setExpenseType] = useState<"fixed" | "variable" | "irregular">(rule?.expense_type ?? "fixed");
  const [amount, setAmount] = useState(rule?.amount?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(rule?.category_id ?? "");
  const [memo, setMemo] = useState(rule?.memo ?? "");
  const [targetDay, setTargetDay] = useState(rule?.target_day?.toString() ?? "1");
  const [startDate, setStartDate] = useState(rule?.start_date ?? new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(rule?.end_date ?? "");

  const isEditing = !!rule;

  const filteredCategories = categories.filter((c) => {
    if (type === "income") return c.type === "income";
    return c.type === "expense" && c.expense_category === expenseType;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.set("type", type);
    if (type === "expense") {
      formData.set("expense_type", expenseType);
    }
    formData.set("amount", amount);
    formData.set("category_id", categoryId);
    if (memo) formData.set("memo", memo);
    formData.set("target_day", targetDay);
    formData.set("start_date", startDate);
    if (endDate) formData.set("end_date", endDate);
    formData.set("is_active", String(rule?.is_active ?? true));

    try {
      const result = rule
        ? await updateRecurringRule(rule.id, formData)
        : await createRecurringRule(formData);

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(
          isEditing
            ? "반복 거래가 수정되었습니다"
            : "반복 거래가 추가되었습니다",
        );
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={isLoading} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-5 pt-3">
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">거래 유형</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={type === "expense" ? "default" : "outline"}
            onClick={() => {
              setType("expense");
              setCategoryId("");
            }}
            aria-pressed={type === "expense"}
            className="flex-1 h-11 text-sm"
          >
            지출
          </Button>
          <Button
            type="button"
            variant={type === "income" ? "default" : "outline"}
            onClick={() => {
              setType("income");
              setCategoryId("");
            }}
            aria-pressed={type === "income"}
            className="flex-1 h-11 text-sm"
          >
            수입
          </Button>
        </div>
      </div>

      {type === "expense" && (
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">지출 유형</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={expenseType === "fixed" ? "default" : "outline"}
              onClick={() => {
                setExpenseType("fixed");
                setCategoryId("");
              }}
              aria-pressed={expenseType === "fixed"}
              className="flex-1 h-11 text-sm"
            >
              고정
            </Button>
            <Button
              type="button"
              variant={expenseType === "variable" ? "default" : "outline"}
              onClick={() => {
                setExpenseType("variable");
                setCategoryId("");
              }}
              aria-pressed={expenseType === "variable"}
              className="flex-1 h-11 text-sm"
            >
              변동
            </Button>
            <Button
              type="button"
              variant={expenseType === "irregular" ? "default" : "outline"}
              onClick={() => {
                setExpenseType("irregular");
                setCategoryId("");
              }}
              aria-pressed={expenseType === "irregular"}
              className="flex-1 h-11 text-sm"
            >
              비정기
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="amount" className="text-sm font-semibold">금액</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          required
          min="1"
          className="h-11 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-sm font-semibold">카테고리</Label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className="flex h-11 w-full items-center justify-between rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" disabled>카테고리를 선택하세요</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="memo" className="text-sm font-semibold">메모 (선택)</Label>
        <Input
          id="memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: 넷플릭스 구독"
          className="h-11 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="targetDay" className="text-sm font-semibold">반복 일자 (1~31)</Label>
        <Input
          id="targetDay"
          type="number"
          value={targetDay}
          onChange={(e) => setTargetDay(e.target.value)}
          required
          min="1"
          max="31"
          className="h-11 text-sm"
        />
        <p className="text-xs text-text-secondary">
          29~31일을 선택하면, 해당 일이 없는 달(예: 2월)에는 그 달의 마지막 날에 기록됩니다.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="startDate" className="text-sm font-semibold">시작일</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="h-11 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate" className="text-sm font-semibold">종료일 (선택)</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="h-11 text-sm"
          />
        </div>
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
          className="h-11 text-sm"
        >
          취소
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !amount || !categoryId || !targetDay || !startDate}
          className="h-11 text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />저장 중</>
          ) : isEditing ? (
            "수정"
          ) : (
            "만들기"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
