import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { BudgetAnalysisClient } from "./budget-analysis-client";

export default async function BudgetAnalysisPage({
  params,
}: {
  params: { yearMonth: string };
}) {
  const { yearMonth } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    redirect("/onboarding");
  }

  const [year, month] = yearMonth.split("-").map(Number);
  const monthStr = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  const startOfMonth = `${year}-${monthStr}-01`;
  const endOfMonth = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

  // 거래 데이터 조회
  const { data: transactionsData } = await supabase.rpc("get_transactions_by_month", {
    p_household_id: profile.household_id,
    p_start_date: startOfMonth,
    p_end_date: endOfMonth,
  });

  const transactions = (transactionsData || []).map((t: any) => ({
    ...t,
    amount: Number(t.amount),
    transaction_date:
      typeof t.transaction_date === "string"
        ? t.transaction_date
        : new Date(t.transaction_date).toISOString().split("T")[0],
  }));

  // 항목별 집계
  const income = transactions
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const fixedExpense = transactions
    .filter((t: any) => t.type === "expense" && t.expense_type === "fixed")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const variableExpense = transactions
    .filter((t: any) => t.type === "expense" && t.expense_type === "variable")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const irregularExpense = transactions
    .filter((t: any) => t.type === "expense" && t.expense_type === "irregular")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalExpense = fixedExpense + variableExpense + irregularExpense;

  const analysisData = {
    income,
    fixedExpense,
    variableExpense,
    irregularExpense,
    totalExpense,
    balance: income - totalExpense,
  };

  return (
    <div className="flex-1 w-full animate-fade-in pb-8">
      {/* Header */}
      <header className="flex items-center justify-between p-6 pt-10">
        <div className="flex items-center gap-4">
          <Link href={`/transactions/${yearMonth}`}>
            <Button
              variant="ghost"
              size="icon"
              className="group rounded-full bg-white/60 hover:bg-white shadow-soft transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5 text-text-main group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
          <div>
            <p className="text-xs text-text-secondary font-bold tracking-wider uppercase mb-0.5">
              Budget Analysis
            </p>
            <h1 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
              예산 실적 분석 <BarChart3 className="h-5 w-5 text-accent-peach" />
            </h1>
          </div>
        </div>
      </header>

      {/* 월 표시 */}
      <div className="px-6 mb-6">
        <div className="glass-panel p-3 rounded-2xl border border-white/60 shadow-sm text-center">
          <span className="font-black text-lg text-text-main">
            {year}년 {month}월 실적
          </span>
        </div>
      </div>

      <div className="px-6 space-y-6">
        <BudgetAnalysisClient data={analysisData} />
      </div>

      {/* Bottom Spacer */}
      <div className="h-24" />
    </div>
  );
}
