import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  Wallet,
  PieChart,
} from "lucide-react";
import { calculateSummary } from "@/lib/calculations/finance";
import CalendarViewClient from "./calendar-view-client";

export default async function MonthDetailPage({
  params,
}: {
  params: { yearMonth: string };
}) {
  const { yearMonth } = await params;
  const supabase = await createClient();

  // ... (auth checks are same)
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

  // Parse year and month
  const [year, month] = yearMonth.split("-").map(Number);

  // Date range for the month (YYYY-MM-DD)
  const monthStr = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  const startOfMonth = `${year}-${monthStr}-01`;
  const endOfMonth = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

  // 병렬 쿼리 실행 (성능 최적화)
  const [transactionsResult, categoriesResult] = await Promise.all([
    supabase.rpc("get_transactions_by_month", {
      p_household_id: profile.household_id,
      p_start_date: startOfMonth,
      p_end_date: endOfMonth,
    }),
    supabase
      .from("categories")
      .select("*")
      .eq("household_id", profile.household_id)
      .order("display_order", { ascending: true }),
  ]);


  // RPC 결과를 기존 형식에 맞게 변환
  const transactions = (transactionsResult.data || []).map((t: any) => ({
    ...t,
    amount: Number(t.amount),
    transaction_date: typeof t.transaction_date === 'string'
      ? t.transaction_date
      : new Date(t.transaction_date).toISOString().split('T')[0],
    categories: t.category_id ? {
      name: t.category_name,
      icon: t.category_icon,
      color: t.category_color,
    } : null,
  }));
  const categories = categoriesResult.data;
  const summary = calculateSummary((transactions || []) as unknown as any[]);

  return (
    <div className="flex-1 w-full animate-fade-in pb-8">
      {/* Header */}
      <header className="flex items-center justify-between p-6 pt-10">
        <div className="flex items-center gap-4">
          <Link href="/">
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
              달력 보기
            </p>
            <h1 className="text-2xl font-black text-text-main tracking-tight">
              가계부
            </h1>
          </div>
        </div>

        <Link href={`/transactions/${yearMonth}/analysis`}>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 shadow-sm text-text-secondary hover:text-primary hover:bg-white transition-all hover:scale-105"
          >
            <PieChart className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      <div className="px-6 space-y-6">
        {/* Month Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-panel p-4 rounded-[1.5rem] flex flex-col items-center justify-center text-center bg-indigo-50/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-10 h-10 bg-indigo-200/30 rounded-full blur-xl"></div>
            <span className="text-[10px] font-bold text-indigo-400 mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> 수입
            </span>
            <span className="text-sm font-black text-text-main leading-tight">
              {(summary.income / 10000).toFixed(0)}만
            </span>
          </div>

          <div className="glass-panel p-4 rounded-[1.5rem] flex flex-col items-center justify-center text-center bg-pink-50/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-10 h-10 bg-pink-200/30 rounded-full blur-xl"></div>
            <span className="text-[10px] font-bold text-pink-400 mb-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> 지출
            </span>
            <span className="text-sm font-black text-text-main leading-tight">
              {(summary.expense / 10000).toFixed(0)}만
            </span>
          </div>

          <div className="glass-panel p-4 rounded-[1.5rem] flex flex-col items-center justify-center text-center bg-emerald-50/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-10 h-10 bg-emerald-200/30 rounded-full blur-xl"></div>
            <span className="text-[10px] font-bold text-emerald-500 mb-1 flex items-center gap-1">
              <Wallet className="h-3 w-3" /> 잔액
            </span>
            <span
              className={`text-sm font-black leading-tight ${summary.balance >= 0 ? "text-emerald-600" : "text-rose-500"}`}
            >
              {(summary.balance / 10000).toFixed(0)}만
            </span>
          </div>
        </div>

        {/* Calendar View */}
        <CalendarViewClient
          year={year}
          month={month}
          transactions={(transactions || []) as any}
          categories={categories || []}
        />
      </div>

      {/* Bottom Spacer */}
      <div className="h-24" />
    </div>
  );
}
