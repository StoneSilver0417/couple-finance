"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Repeat } from "lucide-react";
import { AmountInput } from "@/components/ui/amount-input";
import type { Category } from "@/types";
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
  const [isRecurring, setIsRecurring] = useState(false);
  const [transactionDate, setTransactionDate] = useState(initialData?.transaction_date || today);

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

      {!isEdit && (
        <div className="space-y-4 pt-2">
          <label
            htmlFor="recurring_enabled"
            className="flex min-h-11 min-w-0 cursor-pointer items-center justify-between gap-4 rounded-2xl px-1 focus-within:ring-2 focus-within:ring-primary/40"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Repeat className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 text-sm font-semibold text-text-main">
                매월 반복
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
          <p id="recurring-help" className="break-keep px-1 text-sm leading-6 text-text-secondary">
            선택한 거래일에 매월 기록되며, 29~31일이 없는 달에는 마지막 날로 조정됩니다.
          </p>
          
          {isRecurring && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
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
                className="rounded-2xl border-white/70 bg-white/70 shadow-soft focus:bg-white focus:ring-2 focus:ring-primary/40 h-12 font-medium"
              />
            </div>
          )}
        </div>
      )}

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
