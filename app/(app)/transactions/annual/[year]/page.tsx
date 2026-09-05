import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Gauge,
} from "lucide-react";
import CategoryBreakdownSection from "@/components/dashboard/category-breakdown-section";
import ExpenseTrendSection from "@/components/dashboard/expense-trend-section";
import { StatCard } from "@/components/reports/report-view";
import { Button } from "@/components/ui/button";
import { calculateBudgetUsagePercent } from "@/lib/calculations/finance";
import { createClient } from "@/lib/supabase/server";
import { isValidYearMonth } from "@/lib/validation";
import type { TransactionRpcRow } from "@/types";

const CATEGORY_FALLBACK_COLOR = "#cbd5e1";

function getCurrentYearSeoul(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(new Date());

  return Number(parts.find((part) => part.type === "year")?.value);
}

function getCurrentMonthSeoul(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    month: "numeric",
  }).formatToParts(new Date());

  return Number(parts.find((part) => part.type === "month")?.value);
}

interface AnnualCategoryAggregate {
  name: string;
  value: number;
  color: string;
}

function aggregateAnnualCategories(
  rows: TransactionRpcRow[],
  type: "income" | "expense",
): AnnualCategoryAggregate[] {
  const groups = new Map<string, AnnualCategoryAggregate>();

  for (const row of rows) {
    if (row.type !== type) continue;

    const name = row.category_name || "미분류";
    const amount = Number(row.amount) || 0;
    const existing = groups.get(name);

    if (existing) {
      existing.value += amount;
    } else {
      groups.set(name, {
        name,
        value: amount,
        color: row.category_color || CATEGORY_FALLBACK_COLOR,
      });
    }
  }

  const sorted = Array.from(groups.values()).sort(
    (a, b) => b.value - a.value,
  );

  if (sorted.length <= 8) return sorted;

  const rest = sorted
    .slice(7)
    .reduce((sum, item) => sum + item.value, 0);

  return [
    ...sorted.slice(0, 7),
    { name: "기타", value: rest, color: CATEGORY_FALLBACK_COLOR },
  ];
}

export default async function AnnualSummaryPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearParam } = await params;
  const year = Number(yearParam);
  const currentYear = getCurrentYearSeoul();

  if (
    !/^\d{4}$/.test(yearParam) ||
    !isValidYearMonth(year, 1) ||
    year > currentYear
  ) {
    redirect(`/transactions/annual/${currentYear}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) redirect("/onboarding");

  const [balancesResult, budgetsResult, transactionsResult] =
    await Promise.all([
      supabase
        .from("monthly_balances")
        .select("month, income_total, expense_total")
        .eq("household_id", profile.household_id)
        .eq("year", year)
        .order("month", { ascending: true }),
      supabase
        .from("monthly_budgets")
        .select("total_budget")
        .eq("household_id", profile.household_id)
        .eq("year", year),
      supabase.rpc("get_transactions_by_month", {
        p_household_id: profile.household_id,
        p_start_date: `${year}-01-01`,
        p_end_date: `${year}-12-31`,
      }),
    ]);

  if (
    balancesResult.error ||
    budgetsResult.error ||
    transactionsResult.error
  ) {
    console.error("연간 요약 조회 실패:", {
      balancesError: balancesResult.error,
      budgetsError: budgetsResult.error,
      transactionsError: transactionsResult.error,
    });
  }

  const monthsInYear =
    year === currentYear ? getCurrentMonthSeoul() : 12;
  const balanceByMonth = new Map(
    (balancesResult.data ?? []).map((row) => [row.month, row]),
  );

  const expenseTrend = Array.from({ length: monthsInYear }, (_, index) => {
    const month = index + 1;
    const row = balanceByMonth.get(month);

    return {
      date: `${year}-${String(month).padStart(2, "0")}`,
      label: `${month}월`,
      value: Number(row?.expense_total) || 0,
    };
  });

  const incomeTrend = Array.from({ length: monthsInYear }, (_, index) => {
    const month = index + 1;
    const row = balanceByMonth.get(month);

    return {
      date: `${year}-${String(month).padStart(2, "0")}`,
      label: `${month}월`,
      value: Number(row?.income_total) || 0,
    };
  });

  const totalIncome = (balancesResult.data ?? []).reduce(
    (sum, row) => sum + (Number(row.income_total) || 0),
    0,
  );
  const totalExpense = (balancesResult.data ?? []).reduce(
    (sum, row) => sum + (Number(row.expense_total) || 0),
    0,
  );
  const totalBudget = (budgetsResult.data ?? []).reduce(
    (sum, row) => sum + (Number(row.total_budget) || 0),
    0,
  );

  const transactionRows = (transactionsResult.data ??
    []) as TransactionRpcRow[];
  const variableExpense = transactionRows
    .filter(
      (row) =>
        row.type === "expense" && row.expense_type === "variable",
    )
    .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const budgetUsagePercent = calculateBudgetUsagePercent(
    totalBudget,
    variableExpense,
  );
  // 아직 기록이 없는 달(가입 전이거나 입력을 건너뛴 달)까지 나눠 평균을 희석시키지
  // 않도록, 달력상 경과 개월수가 아니라 실제 잔액 기록이 있는 개월수로 나눈다.
  const monthsWithData = balancesResult.data?.length ?? 0;
  const avgDivisor = Math.max(monthsWithData, 1);
  const avgMonthlyBalance = (totalIncome - totalExpense) / avgDivisor;
  const avgMonthlyVariableExpense = variableExpense / avgDivisor;
  const annualExpenseCategories = aggregateAnnualCategories(
    transactionRows,
    "expense",
  );
  const annualIncomeCategories = aggregateAnnualCategories(
    transactionRows,
    "income",
  );

  const prevYear = year - 1;
  const nextYear = year + 1;

  return (
    <div className="flex-1 w-full animate-fade-in pb-8">
      <header className="flex items-center gap-4 p-6 pt-10">
        <Link href="/transactions">
          <Button
            variant="ghost"
            size="icon"
            aria-label="가계부로 돌아가기"
            className="group cursor-pointer rounded-full bg-white/60 shadow-soft hover:bg-white"
          >
            <ArrowLeft className="h-5 w-5 text-text-main group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
          </Button>
        </Link>
        <div>
          <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-text-secondary">
            Annual Summary
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-text-main">
            연간 요약 <CalendarRange className="h-5 w-5 text-primary" />
          </h1>
        </div>
      </header>

      <div className="px-6 space-y-6">
        <nav
          aria-label="연도 이동"
          className="glass-panel flex items-center justify-between rounded-2xl border border-white/60 p-2 shadow-sm"
        >
          <Link href={`/transactions/annual/${prevYear}`}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="이전 연도"
              className="cursor-pointer rounded-xl hover:bg-white/60"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
          <span className="font-black text-text-main">{year}년</span>
          <Link href={`/transactions/annual/${nextYear}`}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="다음 연도"
              className="cursor-pointer rounded-xl hover:bg-white/60"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
        </nav>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="연간 수입"
            value={`${totalIncome.toLocaleString()}원`}
            icon={BanknoteArrowDown}
            tone="bg-emerald-50 text-emerald-600"
            valueTone="text-emerald-700"
            cardTone="border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white"
          />
          <StatCard
            label="연간 지출"
            value={`${totalExpense.toLocaleString()}원`}
            icon={BanknoteArrowUp}
            tone="bg-rose-50 text-rose-600"
            valueTone="text-rose-700"
            cardTone="border-rose-100 bg-gradient-to-br from-rose-50/80 to-white"
          />
          <StatCard
            label="월평균 잔액"
            value={`${Math.round(avgMonthlyBalance).toLocaleString()}원`}
            caption={`${monthsWithData}개월 기록 기준`}
            icon={CircleDollarSign}
            tone="bg-blue-50 text-blue-600"
          />
          {budgetUsagePercent !== null && (
            <StatCard
              label="예산 사용률"
              value={`${budgetUsagePercent.toFixed(1)}%`}
              caption={`월평균 ${Math.round(avgMonthlyVariableExpense).toLocaleString()}원 지출`}
              icon={Gauge}
              tone="bg-violet-50 text-violet-600"
            />
          )}
        </div>
      </div>

      <div className="mt-6">
        <ExpenseTrendSection
          expenseData={expenseTrend}
          incomeData={incomeTrend}
        />
      </div>

      <CategoryBreakdownSection
        expenseCategories={annualExpenseCategories}
        incomeCategories={annualIncomeCategories}
      />

      <div className="h-24" />
    </div>
  );
}
