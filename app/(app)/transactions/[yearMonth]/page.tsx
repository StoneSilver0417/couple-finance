import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  PieChart,
} from "lucide-react";
import { calculateSummary } from "@/lib/calculations/finance";
import CalendarViewClient from "./calendar-view-client";
import MonthSummaryCards from "./month-summary-cards";
import type { Category, Transaction, TransactionRpcRow } from "@/types";

export default async function MonthDetailPage({
  params,
}: {
  params: Promise<{ yearMonth: string }>;
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


  // RPC 결과를 기존 형식에 맞게 변환.
  // RPC가 transactions 전체 컬럼을 반환하므로 경계에서 한 번만 캐스팅한다
  const transactions = ((transactionsResult.data ?? []) as TransactionRpcRow[]).map(
    (t) => ({
      ...t,
      amount: Number(t.amount),
      transaction_date:
        typeof t.transaction_date === "string"
          ? t.transaction_date
          : new Date(t.transaction_date).toISOString().split("T")[0],
      categories: t.category_id
        ? {
            name: t.category_name ?? "미분류",
            icon: t.category_icon ?? "💰",
            color: t.category_color ?? "#cbd5e1",
          }
        : undefined,
    }),
  ) as unknown as Transaction[];
  const categories = (categoriesResult.data ?? []) as Category[];
  const summary = calculateSummary(transactions);

  return (
    <div className="flex-1 w-full animate-fade-in pb-8">
      {/* Header */}
      <header className="flex items-center justify-between p-6 pt-10">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              aria-label="대시보드로 돌아가기"
              className="group rounded-full bg-white/60 hover:bg-white shadow-soft transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5 text-text-main group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
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
            className="h-auto px-3 py-2 rounded-2xl bg-primary/10 backdrop-blur-md border border-primary/20 shadow-sm text-primary hover:bg-primary/20 transition-all hover:scale-105 flex items-center gap-1.5"
          >
            <PieChart className="h-4 w-4" />
            <span className="text-xs font-bold">분석</span>
          </Button>
        </Link>
      </header>

      <div className="px-6 space-y-6">
        {/* Month Summary Cards - 클릭 시 카테고리별 상세 표시 */}
        <MonthSummaryCards summary={summary} transactions={transactions} />

        {/* Calendar View */}
        <CalendarViewClient
          year={year}
          month={month}
          transactions={transactions}
          categories={categories}
        />
      </div>

      {/* Bottom Spacer */}
      <div className="h-24" />
    </div>
  );
}
