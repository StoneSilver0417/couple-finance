"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { AmountInput } from "@/components/ui/amount-input";

import { Category, PaymentMethod } from "@/types";

export interface TransactionFormData {
  type: "income" | "expense";
  expense_type: "fixed" | "variable" | "irregular" | null;
  amount: number;
  category_id: string;
  payment_method_id: string | null;
  transaction_date: string;
  memo: string | null;
}

interface TransactionFormProps {
  categories: Category[];
  paymentMethods?: PaymentMethod[];
  initialData?: TransactionFormData;
  onSubmit: (formData: FormData) => Promise<void>;
  isLoading: boolean;
  submitLabel?: string;
}

// ... (imports remain)

export default function TransactionFormComponent({
  categories,
  paymentMethods = [],
  initialData,
  onSubmit,
  isLoading,
  submitLabel = "저장",
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

  const today = new Date().toISOString().split("T")[0];

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
          onValueChange={(v) => setExpenseType(v as any)}
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
              paymentMethods={paymentMethods}
              initialData={initialData}
              isLoading={isLoading}
              submitLabel={submitLabel}
            />
          </form>
        </div>
      </TabsContent>

      <TabsContent value="income">
        <div className="bg-transparent">
          {/* Title Removed as Tabs handle it */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormFields
              categories={filteredCategories}
              paymentMethods={paymentMethods}
              initialData={initialData}
              isLoading={isLoading}
              submitLabel={submitLabel}
            />
          </form>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function FormFields({
  categories,
  paymentMethods = [],
  initialData,
  isLoading,
  submitLabel,
}: {
  categories: Category[];
  paymentMethods?: PaymentMethod[];
  initialData?: TransactionFormData;
  isLoading: boolean;
  submitLabel: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const defaultPaymentMethod = paymentMethods.find((pm) => pm.is_default)?.id || "";

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

      {/* 결제수단 선택 */}
      {paymentMethods.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <Label
              htmlFor="payment_method_id"
              className="font-semibold text-text-main text-[13px]"
            >
              결제수단
            </Label>
          </div>
          <div className="relative">
            <select
              id="payment_method_id"
              name="payment_method_id"
              defaultValue={initialData?.payment_method_id || defaultPaymentMethod}
              className="flex h-12 w-full appearance-none rounded-2xl border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-text-main shadow-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundImage: "none" }}
            >
              <option value="">선택 안함</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.icon || "💳"} {pm.name}
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
      )}

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
          defaultValue={initialData?.transaction_date || today}
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
