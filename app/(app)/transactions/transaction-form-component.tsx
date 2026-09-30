"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { Category } from "@/types";
import { isExpenseType, isTransactionType } from "@/lib/validation";
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
  const [categoryId, setCategoryId] = useState<string>(
    initialData?.category_id ?? "",
  );

  function handleTransactionTypeChange(v: string) {
    if (!isTransactionType(v)) return;
    setTransactionType(v);
    setCategoryId("");
  }

  function handleExpenseTypeChange(v: string) {
    if (!isExpenseType(v)) return;
    setExpenseType(v);
    setCategoryId("");
  }

  const filteredCategories = categories.filter((cat) => {
    if (transactionType === "income") {
      return cat.type === "income";
    } else {
      return cat.type === "expense" && cat.expense_category === expenseType;
    }
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("type", transactionType);
    if (transactionType === "expense") {
      formData.set("expense_type", expenseType);
    }
    await onSubmit(formData);
  }

  return (
    <Tabs
      value={transactionType}
      onValueChange={handleTransactionTypeChange}
    >
      <TabsList className="mb-6 grid h-11 w-full grid-cols-2 rounded-2xl border border-white/60 bg-white/30 p-0 shadow-soft backdrop-blur-md">
        <TabsTrigger
          value="expense"
          className="h-11 gap-2 rounded-xl text-sm font-bold tracking-wide text-text-secondary data-[state=active]:bg-white data-[state=active]:text-text-main data-[state=active]:shadow-soft"
        >
          <TrendingDown className="h-4 w-4" />
          지출
        </TabsTrigger>
        <TabsTrigger
          value="income"
          className="h-11 gap-2 rounded-xl text-sm font-bold tracking-wide text-text-secondary data-[state=active]:bg-white data-[state=active]:text-text-main data-[state=active]:shadow-soft"
        >
          <TrendingUp className="h-4 w-4" />
          수입
        </TabsTrigger>
      </TabsList>

      <TabsContent value="expense" className="space-y-6">
        <Tabs
          value={expenseType}
          onValueChange={handleExpenseTypeChange}
        >
          <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl border border-white/60 bg-white/30 p-0 shadow-soft backdrop-blur-md">
            <TabsTrigger
              value="fixed"
              className="h-11 rounded-lg text-sm font-bold text-text-secondary data-[state=active]:bg-white data-[state=active]:text-text-main data-[state=active]:shadow-soft"
            >
              고정 지출
            </TabsTrigger>
            <TabsTrigger
              value="variable"
              className="h-11 rounded-lg text-sm font-bold text-text-secondary data-[state=active]:bg-white data-[state=active]:text-text-main data-[state=active]:shadow-soft"
            >
              변동 지출
            </TabsTrigger>
            <TabsTrigger
              value="irregular"
              className="h-11 rounded-lg text-sm font-bold text-text-secondary data-[state=active]:bg-white data-[state=active]:text-text-main data-[state=active]:shadow-soft"
            >
              비정기 지출
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="bg-transparent">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormFields
              categories={filteredCategories}
              initialData={initialData}
              isLoading={isLoading}
              submitLabel={submitLabel}
              isEdit={isEdit}
              categoryId={categoryId}
              onCategoryChange={setCategoryId}
            />
          </form>
        </div>
      </TabsContent>

      <TabsContent value="income">
        <div className="bg-transparent">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormFields
              categories={filteredCategories}
              initialData={initialData}
              isLoading={isLoading}
              submitLabel={submitLabel}
              isEdit={isEdit}
              categoryId={categoryId}
              onCategoryChange={setCategoryId}
            />
          </form>
        </div>
      </TabsContent>
    </Tabs>
  );
}
