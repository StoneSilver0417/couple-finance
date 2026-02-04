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

  // 이전/다음 월 계산
  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const nextYearMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

  // 거래 데이터 조회
  const { data: transactionsData } = await supabase.rpc("get_transactions_by_month", {
    p_household_id: profile.household_id,
    p_start_date: startOfMonth,
    p_end_date: endOfMonth,
  });

  const transactions = (transactionsData || []).map((t: any) => ({
    id: t.id,
    type: t.type,
    expense_type: t.expense_type,
    amount: Number(t.amount),
    memo: t.memo,
    transaction_date:
      typeof t.transaction_date === "string"
        ? t.transaction_date
        : new Date(t.transaction_date).toISOString().split("T")[0],
    category_name: t.category_name,
    category_icon: t.category_icon,
    category_color: t.category_color,
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

      {/* 월 네비게이션 */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between glass-panel p-2 rounded-2xl border border-white/60 shadow-sm">
          <Link href={`/transactions/${prevYearMonth}/analysis`}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-white/50"
            >
              <ArrowLeft className="h-4 w-4 text-text-secondary" />
            </Button>
          </Link>
          <span className="font-black text-lg text-text-main">
            {year}년 {month}월 실적
          </span>
          <Link href={`/transactions/${nextYearMonth}/analysis`}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-white/50"
            >
              <ArrowLeft className="h-4 w-4 text-text-secondary rotate-180" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="px-6 space-y-6">
        <BudgetAnalysisClient data={analysisData} transactions={transactions} />
      </div>

      {/* Bottom Spacer */}
      <div className="h-24" />
    </div>
  );
}
