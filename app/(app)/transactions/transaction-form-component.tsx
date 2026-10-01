"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { Category } from "@/types";
import { isExpenseType, isTransactionType } from "@/lib/validation";
import {
  initialCategoryId,
  initialTransactionClassification,
  type TransactionClassification,
} from "@/lib/transaction-category-state";
import { FormFields } from "./transaction-form-fields";

export interface TransactionFormData {
  type: "income" | "expense";
  expense_type: "fixed" | "variable" | "irregular" | null;
  amount: number;
  category_id: string;
  transaction_date: string;
  memo: string | null;
  recurring_enabled?: boolean;
  recurring_end_date?: string | null;
  recurring_rule_id?: string | null;
  is_recurring?: boolean;
  update_recurring_rule?: boolean;
}

interface TransactionFormProps {
  readonly categories: readonly Category[];
  readonly initialData?: Partial<TransactionFormData>;
  readonly onSubmit: (formData: FormData) => Promise<void>;
  readonly isLoading: boolean;
  readonly submitLabel?: string;
  readonly isEdit?: boolean;
}

export default function TransactionFormComponent({
  categories,
  initialData,
  onSubmit,
  isLoading,
  submitLabel = "저장",
  isEdit = false,
}: TransactionFormProps) {
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    initialData?.type || "expense",
  );
  const [expenseType, setExpenseType] = useState<
    "fixed" | "variable" | "irregular"
  >(initialData?.expense_type || "variable");

  const initClass = initialTransactionClassification(initialData);
  const [categoryIds, setCategoryIds] = useState<
    Record<TransactionClassification, string>
  >({
    income: initialCategoryId(
      categories,
      "income",
      initClass === "income" ? initialData?.category_id : undefined,
    ),
    fixed: initialCategoryId(
      categories,
      "fixed",
      initClass === "fixed" ? initialData?.category_id : undefined,
    ),
    variable: initialCategoryId(
      categories,
      "variable",
      initClass === "variable" ? initialData?.category_id : undefined,
    ),
    irregular: initialCategoryId(
      categories,
      "irregular",
      initClass === "irregular" ? initialData?.category_id : undefined,
    ),
  });

  const activeClassification: TransactionClassification =
    transactionType === "income" ? "income" : expenseType;

  function handleTransactionTypeChange(value: string) {
    if (isTransactionType(value)) setTransactionType(value);
  }

  function handleExpenseTypeChange(value: string) {
    if (isExpenseType(value)) setExpenseType(value);
  }

  function handleCategoryChange(categoryId: string) {
    setCategoryIds((current) => ({
      ...current,
      [activeClassification]: categoryId,
    }));
  }

  const filteredCategories = categories.filter((cat) => {
    if (transactionType === "income") {
      return cat.type === "income";
    }
    return cat.type === "expense" && cat.expense_category === expenseType;
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("type", transactionType);
    if (transactionType === "expense") {
      formData.set("expense_type", expenseType);
    } else {
      formData.delete("expense_type");
    }
    formData.set("category_id", categoryIds[activeClassification]);
    await onSubmit(formData);
  }

  return (
    <div>
      <div
        className="grid w-full grid-cols-2 mb-6 h-11 rounded-2xl bg-white/30 border border-white/60 shadow-soft backdrop-blur-md"
        role="group"
        aria-label="거래 유형"
      >
        <button
          type="button"
          aria-pressed={transactionType === "expense"}
          onClick={() => handleTransactionTypeChange("expense")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold text-xs tracking-wide text-text-secondary transition-all ${transactionType === "expense" ? "bg-white text-pink-600 shadow-soft" : ""}`}
        >
          <TrendingDown className="h-4 w-4" aria-hidden="true" />
          지출
        </button>
        <button
          type="button"
          aria-pressed={transactionType === "income"}
          onClick={() => handleTransactionTypeChange("income")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold text-xs tracking-wide text-text-secondary transition-all ${transactionType === "income" ? "bg-white text-indigo-600 shadow-soft" : ""}`}
        >
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          수입
        </button>
      </div>

      {transactionType === "expense" && (
        <div
          className="grid w-full grid-cols-3 bg-white/30 border border-white/60 h-10 rounded-xl shadow-soft backdrop-blur-md"
          role="group"
          aria-label="지출 유형"
        >
          {(["fixed", "variable", "irregular"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={expenseType === value}
              onClick={() => handleExpenseTypeChange(value)}
              className={`rounded-lg text-[11px] font-bold text-text-secondary transition-all ${expenseType === value ? "bg-white text-primary-dark shadow-soft" : ""}`}
            >
              {value === "fixed"
                ? "고정 지출"
                : value === "variable"
                  ? "변동 지출"
                  : "비정기 지출"}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 bg-transparent">
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormFields
            categories={filteredCategories}
            initialData={initialData}
            isLoading={isLoading}
            submitLabel={submitLabel}
            isEdit={isEdit}
            categoryId={categoryIds[activeClassification]}
            onCategoryChange={handleCategoryChange}
          />
        </form>
      </div>
    </div>
  );
}
