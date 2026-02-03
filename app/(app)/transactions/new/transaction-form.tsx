"use client";

import { useState } from "react";
import { createTransaction } from "@/lib/transaction-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import TransactionFormComponent, {
  TransactionFormData,
} from "../transaction-form-component";

import { Category } from "@/types";

interface TransactionFormProps {
  categories: Category[];
  initialDate?: string;
}

export default function TransactionForm({
  categories,
  initialDate,
}: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    const result = await createTransaction(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    }
    // Redirect is handled by server action
  }

  return (
    <div className="flex-1 w-full animate-fade-in pb-8">
      {/* Stitch Header */}
      <header className="flex items-center gap-4 p-6 pt-10">
        <Link href="/transactions">
          <Button
            variant="ghost"
            size="icon"
            className="group rounded-full bg-white/60 hover:bg-white shadow-soft transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 text-text-main group-hover:-translate-x-1 transition-transform" />
          </Button>
        </Link>
        <div>
          <p className="text-[11px] text-text-secondary font-semibold tracking-[0.18em] uppercase mb-1">
            New Entry
          </p>
          <h1 className="text-[26px] font-black tracking-tight bg-gradient-to-r from-primary-dark to-[#ff4d6d] text-transparent bg-clip-text leading-tight">
            거래 추가
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            오늘의 수입·지출을 기록해볼까요?
          </p>
        </div>
      </header>

      <div className="px-5">
        <div className="glass-panel rounded-[2.5rem] p-6 shadow-glass border border-white/60 bg-gradient-to-b from-[#FFF5F7]/95 via-white/95 to-[#FFF8E1]/95">
          <TransactionFormComponent
            categories={categories}
            initialData={
              initialDate
                ? ({
                    transaction_date: initialDate,
                  } as Partial<TransactionFormData> as TransactionFormData)
                : undefined
            }
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitLabel="추가하기"
          />
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="h-24" />
    </div>
  );
}
