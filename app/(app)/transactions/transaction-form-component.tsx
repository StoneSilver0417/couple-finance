"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Category } from "@/types";
import { FormFields } from "./transaction-form-fields";

export interface TransactionFormData {
  type: "income" | "expense";
  expense_type: "fixed" | "variable" | "irregular" | null;
  amount: number;
  category_id: string;
  transaction_date: string;
  memo: string | null;
}

interface TransactionFormProps {
  categories: Category[];
  initialData?: Partial<TransactionFormData>;
  onSubmit: (formData: FormData) => Promise<void>;
  isLoading: boolean;
  submitLabel?: string;
  isEdit?: boolean;
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
      onValueChange={(v) => setTransactionType(v as "income" | "expense")}
    >
      <TabsList className="grid w-full grid-cols-2 mb-6 h-11 rounded-2xl bg-white/30 border border-white/60 shadow-soft backdrop-blur-md">
        <TabsTrigger
          value="expense"
          className="gap-2 rounded-xl font-bold text-xs tracking-wide data-[state=active]:bg-white data-[state=active]:shadow-soft data-[state=active]:text-pink-600 text-text-secondary"
        >
          <TrendingDown className="h-4 w-4" />
          지출
        </TabsTrigger>
        <TabsTrigger
          value="income"
          className="gap-2 rounded-xl font-bold text-xs tracking-wide data-[state=active]:bg-white data-[state=active]:shadow-soft data-[state=active]:text-indigo-600 text-text-secondary"
        >
          <TrendingUp className="h-4 w-4" />
          수입
        </TabsTrigger>
      </TabsList>

      <TabsContent value="expense" className="space-y-6">
        <Tabs
          value={expenseType}
          onValueChange={(v) =>
            setExpenseType(v as "fixed" | "variable" | "irregular")
          }
        >
          <TabsList className="grid w-full grid-cols-3 bg-white/30 border border-white/60 h-10 rounded-xl shadow-soft backdrop-blur-md">
            <TabsTrigger
              value="fixed"
              className="rounded-lg text-[11px] font-bold text-text-secondary data-[state=active]:bg-white data-[state=active]:shadow-soft data-[state=active]:text-primary-dark"
            >
              고정 지출
            </TabsTrigger>
            <TabsTrigger
              value="variable"
              className="rounded-lg text-[11px] font-bold text-text-secondary data-[state=active]:bg-white data-[state=active]:shadow-soft data-[state=active]:text-primary-dark"
            >
              변동 지출
            </TabsTrigger>
            <TabsTrigger
              value="irregular"
              className="rounded-lg text-[11px] font-bold text-text-secondary data-[state=active]:bg-white data-[state=active]:shadow-soft data-[state=active]:text-primary-dark"
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
            />
          </form>
        </div>
      </TabsContent>
    </Tabs>
  );
}
