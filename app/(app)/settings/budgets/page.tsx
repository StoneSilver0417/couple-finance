import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BudgetClient } from "./budget-client";
import { ArrowLeft, Target } from "lucide-react";

interface BudgetsPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
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

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // Read from query params or default to current
  const yearParam = searchParams?.year;
  const monthParam = searchParams?.month;

  let year = yearParam ? parseInt(yearParam as string) : currentYear;
  let month = monthParam ? parseInt(monthParam as string) : currentMonth;

  // Validation
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    year = currentYear;
    month = currentMonth;
  }

  // Calculate prev/next
  const date = new Date(year, month - 1, 1);
  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);

  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  const nextYear = nextDate.getFullYear();
  const nextMonth = nextDate.getMonth() + 1;

  // Fetch monthly budget
  const { data: monthlyBudget } = await supabase
    .from("monthly_budgets")
    .select("*")
    .eq("household_id", profile.household_id)
    .eq("year", year)
    .eq("month", month)
    .single();

  const currentBudget = monthlyBudget?.total_budget || 0;

  return (
    <div className="flex-1 w-full animate-fade-in pb-8">
      {/* Header */}
      <header className="flex flex-col gap-6 p-6 pt-10">
        <div className="flex items-center gap-4">
          <Link href="/settings">
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
              Budget Planning
            </p>
            <h1 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
              예산 설정 <Target className="h-5 w-5 text-accent-peach" />
            </h1>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between glass-panel p-2 rounded-2xl border border-white/60 shadow-sm">
          <Link href={`/settings/budgets?year=${prevYear}&month=${prevMonth}`}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-white/50"
            >
              <ArrowLeft className="h-4 w-4 text-text-secondary" />
            </Button>
          </Link>
          <span className="font-black text-lg text-text-main">
            {year}년 {month}월
          </span>
          <Link href={`/settings/budgets?year=${nextYear}&month=${nextMonth}`}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-white/50"
            >
              <ArrowLeft className="h-4 w-4 text-text-secondary rotate-180" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="px-6 space-y-6">
        <div className="glass-panel w-full rounded-[2.5rem] p-6 shadow-glass border border-white/60">
          <BudgetClient
            currentBudget={currentBudget}
            year={year}
            month={month}
          />
        </div>
      </div>

      {/* Bottom Spacer - Increased to prevent BottomNav overlap */}
      <div className="h-40" />
    </div>
  );
}
