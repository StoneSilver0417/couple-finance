import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateSummary } from "@/lib/calculations/finance";
import { Transaction } from "@/types";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Wallet,
  TrendingUp as TrendUp,
  TrendingDown,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import ExpenseTrendSection from "@/components/dashboard/expense-trend-section";
import AnalysisSection from "@/components/dashboard/analysis-section";
import { groupByCategory } from "@/lib/calculations/finance";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Auth & Profile Check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, full_name, email, avatar_url")
    .eq("id", user.id)
    .single();
  if (!profile?.household_id) redirect("/onboarding");

  // 2. Data Fetching Prep
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDate = new Date(year, month, 0).getDate();
  const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${String(lastDate).padStart(2, "0")}`;

  // 3. 모든 쿼리를 병렬로 실행 (성능 최적화)
  const [
    transactionsResult,
    membersResult,
    assetsResult,
    monthlyBudgetResult,
    monthlyBalancesResult,
    householdResult,
  ] = await Promise.all([
    // 트랜잭션 (RPC 함수 사용)
    supabase.rpc("get_transactions_by_month", {
      p_household_id: profile.household_id,
      p_start_date: startOfMonth,
      p_end_date: endOfMonth,
    }),
    // 가구 멤버
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("household_id", profile.household_id)
      .limit(2),
    // 자산
    supabase
      .from("assets")
      .select("*")
      .eq("household_id", profile.household_id),
    // 월별 예산
    supabase
      .from("monthly_budgets")
      .select("total_budget")
      .eq("household_id", profile.household_id)
      .eq("year", year)
      .eq("month", month)
      .single(),
    // 월별 잔액 (최근 6개월)
    supabase
      .from("monthly_balances")
      .select("year, month, expense_total, income_total")
      .eq("household_id", profile.household_id)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(6),
    // 가구 정보
    supabase
      .from("households")
      .select("name")
      .eq("id", profile.household_id)
      .single(),
  ]);

  // RPC 결과를 기존 형식에 맞게 변환
  const currentMonthTxs: Transaction[] = (transactionsResult.data || []).map((t: any) => ({
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
  })) as unknown as Transaction[];
  const members = membersResult.data;
  const assets = assetsResult.data;
  const monthlyBudget = monthlyBudgetResult.data;
  const monthlyBalances = monthlyBalancesResult.data;
  const household = householdResult.data;

  // 4. Calculate Summary
  const summary = calculateSummary(currentMonthTxs);

  const totalAssets =
    assets
      ?.filter((a) => !a.is_liability)
      .reduce((sum, a) => sum + Number(a.current_amount), 0) || 0;

  const totalLiabilities =
    assets
      ?.filter((a) => a.is_liability)
      .reduce((sum, a) => sum + Number(a.current_amount), 0) || 0;

  const netWorth = totalAssets - totalLiabilities;

  const totalBudget = monthlyBudget?.total_budget || 0;

  // Prepare trend data
  const reversedBalances = (monthlyBalances || []).reverse();
  const expenseTrend = reversedBalances.map((mb) => ({
    date: `${mb.year}-${String(mb.month).padStart(2, "0")}`,
    label: `${mb.month}월`,
    value: Number(mb.expense_total) || 0,
  }));

  const incomeTrend = reversedBalances.map((mb) => ({
    date: `${mb.year}-${String(mb.month).padStart(2, "0")}`,
    label: `${mb.month}월`,
    value: Number(mb.income_total) || 0,
  }));

  // 9. Prepare Category Data for Analysis
  const expenseByCategory = groupByCategory(
    currentMonthTxs.filter((tx) => tx.type === "expense"),
  );
  const incomeByCategory = groupByCategory(
    currentMonthTxs.filter((tx) => tx.type === "income"),
  );

  return (
    <main className="flex-1 w-full animate-fade-in relative z-10">
      {/* --- HEADER --- */}
      <DashboardHeader
        members={members || []}
        householdName={household?.name || "우리 가족"}
      />

      {/* --- MAIN BALANCE CARD --- */}
      <section className="px-6 mb-4">
        <div className="glass-panel w-full rounded-[2.5rem] p-4 shadow-glass relative overflow-hidden group transition-all hover:shadow-glow">
          {/* Background Blurs */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-coral/20 rounded-full blur-3xl opacity-60"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/50 border border-white/60 backdrop-blur-sm mb-2 shadow-sm">
              <span className="text-[10px] font-bold text-text-main uppercase tracking-wide">
                이번 달 수입지출현황
              </span>
              <span className="text-[10px] text-primary-dark">✨</span>
            </div>

            <h1 className="text-[1.75rem] font-black text-text-main tracking-tight mb-3 drop-shadow-sm flex items-baseline justify-center">
              ₩{summary.balance.toLocaleString()}
            </h1>

            <div className="flex w-full justify-between items-center gap-3 bg-white/60 rounded-2xl p-1.5 border border-white/60 shadow-sm backdrop-blur-md">
              <div className="flex-1 flex flex-col items-center py-2 rounded-xl transition hover:bg-white/50 cursor-default">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center text-green-500 shadow-sm ring-1 ring-green-100">
                    <ArrowDown className="w-2.5 h-2.5 stroke-[3px]" />
                  </div>
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">
                    수입
                  </span>
                </div>
                <span className="text-lg font-extrabold text-text-main">
                  +{(summary.income / 10000).toFixed(0)}만
                </span>
              </div>

              <div className="h-8 w-[1px] bg-gray-200/60"></div>

              <div className="flex-1 flex flex-col items-center py-2 rounded-xl transition hover:bg-white/50 cursor-default">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary-dark shadow-sm ring-1 ring-primary/20">
                    <ArrowUp className="w-2.5 h-2.5 stroke-[3px]" />
                  </div>
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">
                    지출
                  </span>
                </div>
                <span className="text-lg font-extrabold text-primary-dark">
                  -{(summary.expense / 10000).toFixed(0)}만
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- ANALYSIS SECTION (Expense/Income Toggles) --- */}
      <AnalysisSection
        expenseData={expenseByCategory}
        incomeData={incomeByCategory}
        totalBudget={totalBudget}
        totalExpense={summary.expense}
        totalIncome={summary.income}
      />

      {/* --- TREND CHART --- */}
      <ExpenseTrendSection
        expenseData={expenseTrend}
        incomeData={incomeTrend}
      />

      {/* --- ASSET SUMMARY --- */}
      <section className="px-6 mb-8">
        <div className="flex items-center justify-between mb-5 pl-1">
          <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
            자산 현황 <Wallet className="w-5 h-5 text-emerald-500" />
          </h3>
          <Link href="/assets">
            <button className="px-3 py-1.5 rounded-full bg-white/80 text-text-main text-xs font-bold flex items-center shadow-sm border border-white/60 hover:bg-white transition-colors">
              상세보기 <ChevronRight className="w-3 h-3 ml-1" />
            </button>
          </Link>
        </div>

        <div className="glass-panel rounded-[2rem] p-5 shadow-glass border border-white/60">
          <div className="flex flex-col items-center text-center mb-4">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">
              순자산
            </span>
            <h2
              className={`text-3xl font-black tracking-tight ${netWorth >= 0 ? "text-text-main" : "text-destructive"}`}
            >
              ₩{netWorth.toLocaleString()}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-2xl p-4 text-center overflow-hidden">
              <span className="text-[10px] font-bold text-emerald-600 mb-1 flex items-center justify-center gap-1">
                <TrendUp className="h-3 w-3 shrink-0" /> 총 자산
              </span>
              <span className="text-base font-black text-emerald-700 block truncate">
                ₩{totalAssets.toLocaleString()}
              </span>
            </div>
            <div className="bg-rose-50 rounded-2xl p-4 text-center overflow-hidden">
              <span className="text-[10px] font-bold text-rose-500 mb-1 flex items-center justify-center gap-1">
                <TrendingDown className="h-3 w-3 shrink-0" /> 총 부채
              </span>
              <span className="text-base font-black text-rose-600 block truncate">
                ₩{totalLiabilities.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Space for Bottom Nav */}
      <div className="h-4"></div>
    </main>
  );
}
