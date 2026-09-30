"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { AmountInput } from "@/components/ui/amount-input";
import type { Category } from "@/types";
import type { TransactionFormData } from "./transaction-form-component";
import { RecurringControls } from "./recurring-controls";

export function FormFields({
  categories,
  initialData,
  isLoading,
  submitLabel,
  isEdit,
  categoryId,
  onCategoryChange,
}: {
  readonly categories: readonly Category[];
  readonly initialData?: Partial<TransactionFormData>;
  readonly isLoading: boolean;
  readonly submitLabel: string;
  readonly isEdit?: boolean;
  readonly categoryId: string;
  readonly onCategoryChange: (id: string) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [transactionDate, setTransactionDate] = useState(
    initialData?.transaction_date || today,
  );

  return (
    <>
      <div className="space-y-2">
        <div className="px-1">
          <Label
            htmlFor="amount"
            className="text-sm font-semibold text-text-main"
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
            className="text-sm font-semibold text-text-main"
          >
            카테고리 *
          </Label>
        </div>
        <div className="relative">
          <select
            id="category_id"
            name="category_id"
            required
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
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
            className="text-sm font-semibold text-text-main"
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
            className="text-sm font-semibold text-text-main"
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

      <RecurringControls
        initialData={initialData}
        transactionDate={transactionDate}
        isEdit={isEdit}
      />

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
