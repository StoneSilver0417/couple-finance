"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Repeat, CheckCircle2, AlertCircle } from "lucide-react";
import { AmountInput } from "@/components/ui/amount-input";
import { getRecurringRule } from "@/lib/recurring-actions";
import type { Category, RecurringRule } from "@/types";
import type { TransactionFormData } from "./transaction-form-component";

export function FormFields({
  categories,
  initialData,
  isLoading,
  submitLabel,
  isEdit,
}: {
  categories: Category[];
  initialData?: Partial<TransactionFormData>;
  isLoading: boolean;
  submitLabel: string;
  isEdit?: boolean;
}) {
  const today = new Date().toISOString().split("T")[0];
  const hasExistingRule = Boolean(initialData?.recurring_rule_id);
  const [isRecurring, setIsRecurring] = useState(
    initialData?.recurring_enabled ?? hasExistingRule,
  );
  const [updateRecurringRule, setUpdateRecurringRule] = useState(
    initialData?.update_recurring_rule ?? true,
  );
  const [transactionDate, setTransactionDate] = useState(
    initialData?.transaction_date || today,
  );
  const [recurringEndDate, setRecurringEndDate] = useState(
    initialData?.recurring_end_date || "",
  );
  const [fetchedRule, setFetchedRule] = useState<RecurringRule | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (initialData?.recurring_rule_id) {
      getRecurringRule(initialData.recurring_rule_id).then((res) => {
        if (isMounted && res && "data" in res && res.data) {
          setFetchedRule(res.data);
          if (res.data.end_date && !initialData.recurring_end_date) {
            setRecurringEndDate(res.data.end_date);
          }
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [initialData?.recurring_rule_id, initialData?.recurring_end_date]);

  const targetDay = transactionDate ? new Date(transactionDate).getDate() : 1;

  return (
    <>
      <div className="space-y-2">
        <div className="px-1">
          <Label
            htmlFor="amount"
            className="font-semibold text-text-main text-[13px]"
          >
            금액 *
          </Label>
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold z-10">
            ₩
          </span>
          <AmountInput
            id="amount"
            name="amount"
            placeholder="10,000"
            required
            defaultValue={initialData?.amount}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <Label
            htmlFor="category_id"
            className="font-semibold text-text-main text-[13px]"
          >
            카테고리 *
          </Label>
        </div>
        <div className="relative">
          <select
            id="category_id"
            name="category_id"
            required
            defaultValue={initialData?.category_id}
            className="flex h-12 w-full appearance-none rounded-2xl border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-text-main shadow-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundImage: "none" }}
          >
            <option value="">선택하세요</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L5 5L9 1"
                stroke="#64748B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <Label
            htmlFor="transaction_date"
            className="font-semibold text-text-main text-[13px]"
          >
            날짜 *
          </Label>
        </div>
        <Input
          id="transaction_date"
          name="transaction_date"
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          required
          className="rounded-2xl border-white/70 bg-white/70 shadow-soft focus:bg-white focus:ring-2 focus:ring-primary/40 h-12 font-medium"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <Label
            htmlFor="memo"
            className="font-semibold text-text-main text-[13px]"
          >
            메모 (선택)
          </Label>
        </div>
        <Input
          id="memo"
          name="memo"
          type="text"
          placeholder="상세 내용을 입력하세요"
          defaultValue={initialData?.memo || ""}
          className="rounded-2xl border-white/70 bg-white/60 shadow-soft focus:bg-white h-12"
        />
      </div>

      <div className="space-y-4 pt-2 border-t border-slate-100">
        {hasExistingRule && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Repeat className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold text-primary-dark">
                  매월 반복 거래 연동 중
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                규칙 매월 {fetchedRule?.target_day || targetDay}일
              </span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed pl-8">
              {fetchedRule?.end_date
                ? `종료 예정일: ${fetchedRule.end_date}`
                : "종료일 없이 계속 반복되는 규칙입니다."}
            </p>
          </div>
        )}

        <label
          htmlFor="recurring_enabled"
          className="flex min-h-11 min-w-0 cursor-pointer items-center justify-between gap-4 rounded-2xl px-1 focus-within:ring-2 focus-within:ring-primary/40"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Repeat className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 text-sm font-semibold text-text-main">
              {hasExistingRule
                ? "매월 반복 거래 연동 유지"
                : isEdit
                  ? "매월 반복 거래로 등록/연동"
                  : "매월 반복"}
            </span>
          </div>
          <span className="relative inline-flex h-11 w-14 shrink-0 items-center justify-center">
            <input
              type="checkbox"
              id="recurring_enabled"
              name="recurring_enabled"
              value="true"
              className="sr-only peer"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              aria-describedby="recurring-help"
            />
            <span className="peer relative inline-flex h-6 w-11 shrink-0 overflow-hidden rounded-full bg-gray-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:content-[''] after:transition-transform peer-focus:ring-4 peer-focus:ring-primary/20 peer-checked:bg-primary peer-checked:after:translate-x-5 peer-checked:after:border-white" />
          </span>
        </label>

        {isRecurring ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <p id="recurring-help" className="break-keep px-1 text-xs leading-5 text-text-secondary">
              선택한 거래일(매월 {targetDay}일)에 매월 기록되며, 29~31일이 없는 달에는 마지막 날로 자동 조정됩니다.
            </p>

            <div className="space-y-2">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1">
                <Label
                  htmlFor="recurring_end_date"
                  className="shrink-0 font-semibold text-text-main text-[13px]"
                >
                  종료일 (선택)
                </Label>
                <span className="min-w-0 text-[11px] text-text-secondary">
                  지정하지 않으면 계속 반복됩니다
                </span>
              </div>
              <Input
                id="recurring_end_date"
                name="recurring_end_date"
                type="date"
                min={transactionDate}
                value={recurringEndDate}
                onChange={(e) => setRecurringEndDate(e.target.value)}
                className="rounded-2xl border-white/70 bg-white/70 shadow-soft focus:bg-white focus:ring-2 focus:ring-primary/40 h-12 font-medium"
              />
            </div>

            {hasExistingRule && isEdit && (
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="update_recurring_rule"
                    value="true"
                    checked={updateRecurringRule}
                    onChange={(e) => setUpdateRecurringRule(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-text-main flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary inline" />
                      연동된 반복 규칙 정보도 함께 업데이트
                    </span>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                      수정한 금액, 카테고리, 메모 및 날짜를 반복 규칙에도 함께 반영합니다.
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        ) : (
          hasExistingRule && (
            <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-amber-800 text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-snug">
                반복 거래 연동을 해제합니다. 기존 반복 규칙은 유지되며, 이번 거래만 단독 거래로 분리됩니다.
              </p>
            </div>
          )
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-14 rounded-full font-extrabold bg-gradient-to-tr from-primary-dark to-primary text-white hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-primary/40 text-base border-none mt-6"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          submitLabel
        )}
      </Button>
    </>
  );
}
