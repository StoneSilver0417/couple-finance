"use server";

import { revalidatePath } from "next/cache";
import {
  calculateBudgetUsagePercent,
  calculateSummary,
} from "@/lib/calculations/finance";
import { getKoreanErrorMessage } from "@/lib/error-messages";
import {
  GEMINI_MODEL,
  generateReportContent,
  validateGeminiKey,
  type GeminiReportAggregates,
} from "@/lib/ai/gemini";
import {
  getPeriodRange,
  type PeriodicReportType,
} from "@/lib/period-range";
import { getHouseholdContext } from "@/lib/supabase/household-context";
import { getTrimmedString, isValidYearMonth } from "@/lib/validation";
import type { TransactionRpcRow } from "@/types";
import type { MonthlyReportContent, ReportAiContent, ReportStats } from "@/types/report";

export interface ReportActionState {
  error?: string;
  success?: boolean;
}

interface ReportTransaction {
  type: "income" | "expense";
  expenseType: "fixed" | "variable" | "irregular" | null;
  amount: number;
  date: string;
  categoryName: string;
  categoryIcon: string;
}

interface CategoryAggregate {
  name: string;
  icon: string;
  amount: number;
}

const PERIODIC_REPORT_OPTIONS: Record<
  PeriodicReportType,
  { detailLimit: number; trendMonths: number }
> = {
  quarter: { detailLimit: 8, trendMonths: 3 },
  half: { detailLimit: 10, trendMonths: 6 },
  year: { detailLimit: 12, trendMonths: 12 },
};

const PERIOD_KEY_PATTERNS: Record<PeriodicReportType, RegExp> = {
  quarter: /^\d{4}-Q[1-4]$/,
  half: /^\d{4}-H[1-2]$/,
  year: /^\d{4}$/,
};

function parsePeriodicReportInput(
  formData: FormData,
): { periodType: PeriodicReportType; periodKey: string } | null {
  const periodType = formData.get("periodType");
  const periodKey = formData.get("periodKey");

  if (typeof periodType !== "string" || typeof periodKey !== "string") {
    return null;
  }
  if (
    periodType !== "quarter" &&
    periodType !== "half" &&
    periodType !== "year"
  ) {
    return null;
  }
  if (!PERIOD_KEY_PATTERNS[periodType].test(periodKey)) {
    return null;
  }
  if (!isValidYearMonth(Number(periodKey.slice(0, 4)), 1)) {
    return null;
  }

  return { periodType, periodKey };
}

function parseYearMonth(value: FormDataEntryValue | null): {
  year: number;
  month: number;
  yearMonth: string;
} | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month] = value.split("-").map(Number);
  if (!isValidYearMonth(year, month)) return null;
  return { year, month, yearMonth: value };
}

function getCurrentYearMonthInKorea(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return { year, month };
}

function getCurrentDateInKorea(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function getMonthRange(year: number, month: number): {
  start: string;
  end: string;
} {
  const monthString = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${monthString}-01`,
    end: `${year}-${monthString}-${String(lastDay).padStart(2, "0")}`,
  };
}

function mapTransactions(rows: TransactionRpcRow[]): ReportTransaction[] {
  return rows.map((row) => ({
    type: row.type,
    expenseType: row.expense_type,
    amount: Number(row.amount) || 0,
    date:
      typeof row.transaction_date === "string"
        ? row.transaction_date
        : new Date(row.transaction_date).toISOString().split("T")[0],
    categoryName: row.category_name || "미분류",
    categoryIcon: row.category_icon || "WalletCards",
  }));
}

function aggregateExpenseCategories(
  transactions: ReportTransaction[],
): CategoryAggregate[] {
  const groups = new Map<string, CategoryAggregate>();

  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    const existing = groups.get(transaction.categoryName);
    if (existing) {
      existing.amount += transaction.amount;
    } else {
      groups.set(transaction.categoryName, {
        name: transaction.categoryName,
        icon: transaction.categoryIcon,
        amount: transaction.amount,
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.amount - a.amount);
}

function sumExpenseType(
  transactions: ReportTransaction[],
  expenseType: "fixed" | "variable" | "irregular",
): number {
  return transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        transaction.expenseType === expenseType,
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

function formatWon(value: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(Math.round(value))}원`;
}

function createFallbackReportContent(
  stats: ReportStats,
  aggregates: GeminiReportAggregates,
): ReportAiContent {
  const isMonthlyReport = !stats.periodLabel && !aggregates.periodLabel;
  const periodLabel =
    stats.periodLabel ?? aggregates.periodLabel ?? "이번 달";
  const previousPeriodLabel =
    stats.previousPeriodLabel ??
    aggregates.previousPeriodLabel ??
    "전월";
  const nextPeriodLabel = isMonthlyReport ? "다음 달" : "다음 기간";
  const balanceTone =
    stats.balance >= 0
      ? `수입에서 지출을 제외하고 ${formatWon(stats.balance)}이 남았습니다.`
      : `지출이 수입보다 ${formatWon(Math.abs(stats.balance))} 많았습니다.`;
  const biggestExpense = aggregates.categoryExpenses[0];
  const headline = biggestExpense
    ? isMonthlyReport
      ? `${biggestExpense.name} 지출을 중심으로 점검이 필요한 달입니다`
      : `${biggestExpense.name} 지출을 중심으로 ${periodLabel} 흐름 점검이 필요합니다`
    : isMonthlyReport
      ? "이번 달 가계 흐름을 차분히 점검해볼 달입니다"
      : `${periodLabel} 가계 흐름을 차분히 점검해보세요`;

  const momComments = aggregates.monthOverMonthHighlights.map((category) => {
    const direction = category.diff > 0 ? "늘었습니다" : "줄었습니다";
    return `${category.name} 지출이 ${previousPeriodLabel}보다 ${formatWon(Math.abs(category.diff))} ${direction}.`;
  });

  const budgetFeedback =
    stats.totalBudget > 0 && stats.budgetUsagePercent !== null
      ? `${periodLabel} 예산 ${formatWon(stats.totalBudget)} 중 ${stats.budgetUsagePercent.toFixed(1)}%를 사용했습니다. 80%를 넘었다면 남은 기간 변동비를 우선 조절하세요.`
      : isMonthlyReport
        ? "이번 달 예산이 등록되어 있지 않습니다. 다음 달부터는 월 예산을 먼저 정해두면 지출 속도를 판단하기 쉽습니다."
        : `${periodLabel} 예산이 등록되어 있지 않습니다. ${nextPeriodLabel}부터는 월별 예산을 먼저 정해두면 지출 속도를 판단하기 쉽습니다.`;

  const highExpenseTip = biggestExpense
    ? `${biggestExpense.name} 항목은 ${nextPeriodLabel}에 주간 한도를 정해 초과 여부를 확인하세요.`
    : `${nextPeriodLabel}에는 지출 카테고리를 꾸준히 나눠 기록해 흐름을 더 선명하게 보세요.`;

  const fixedRatio =
    stats.expense > 0 ? (stats.fixedExpense / stats.expense) * 100 : 0;
  const fixedTip =
    fixedRatio >= 50
      ? "고정비 비중이 큰 편입니다. 구독, 통신, 보험처럼 매달 반복되는 항목부터 재점검하세요."
      : "고정비보다 변동비 조정 여지가 큽니다. 외식, 쇼핑, 생활비 항목을 먼저 살펴보세요.";

  return {
    headline,
    summaryComment: `${periodLabel} 수입은 ${formatWon(stats.income)}, 지출은 ${formatWon(stats.expense)}입니다. ${balanceTone}`,
    momComments,
    budgetFeedback,
    savingTips: [highExpenseTip, fixedTip],
    assetComment:
      stats.netWorth !== null
        ? isMonthlyReport
          ? `최근 기록 기준 순자산은 ${formatWon(stats.netWorth)}입니다. 변동이 큰 달에는 지출보다 자산 기록의 입력 시점도 함께 확인하세요.`
          : `최근 기록 기준 순자산은 ${formatWon(stats.netWorth)}입니다. 변동이 큰 기간에는 지출보다 자산 기록의 입력 시점도 함께 확인하세요.`
        : "",
    praise:
      stats.balance >= 0
        ? `수입과 지출을 기록해 남는 금액을 확인한 점이 좋습니다. 이 흐름을 ${nextPeriodLabel} 예산 설정으로 이어가세요.`
        : `지출 초과를 숫자로 확인한 것만으로도 ${nextPeriodLabel} 조정의 출발점이 됩니다.`,
  };
}

export async function saveGeminiApiKey(
  _prevState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };

  const apiKey = getTrimmedString(formData.get("apiKey"), 200);
  if (!apiKey || apiKey.length < 20) {
    return { error: "올바른 Gemini API 키를 입력해주세요." };
  }

  try {
    const isValid = await validateGeminiKey(apiKey);
    if (!isValid) {
      return {
        error:
          "Gemini API 키가 유효하지 않습니다. 키와 네트워크 연결을 확인해주세요.",
      };
    }

    const { error } = await ctx.supabase.from("household_ai_settings").upsert(
      {
        household_id: ctx.householdId,
        gemini_api_key: apiKey,
        created_by: ctx.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "household_id" },
    );
    if (error) throw error;

    revalidatePath("/settings");
    return { success: true };
  } catch (error: unknown) {
    console.error("Gemini API 키 저장 실패:", error);
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function deleteGeminiApiKey(): Promise<ReportActionState> {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };

  try {
    const { error } = await ctx.supabase
      .from("household_ai_settings")
      .delete()
      .eq("household_id", ctx.householdId);
    if (error) throw error;

    revalidatePath("/settings");
    return { success: true };
  } catch (error: unknown) {
    console.error("Gemini API 키 삭제 실패:", error);
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function generateMonthlyReport(
  _prevState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };

  const parsed = parseYearMonth(formData.get("yearMonth"));
  if (!parsed) {
    return { error: "연도와 월 정보가 올바르지 않습니다." };
  }

  const current = getCurrentYearMonthInKorea();
  if (
    parsed.year > current.year ||
    (parsed.year === current.year && parsed.month > current.month)
  ) {
    return { error: "미래 월의 보고서는 만들 수 없습니다." };
  }

  try {
    const { data: aiSetting, error: aiSettingError } = await ctx.supabase
      .from("household_ai_settings")
      .select("gemini_api_key")
      .eq("household_id", ctx.householdId)
      .maybeSingle();
    if (aiSettingError) throw aiSettingError;
    if (!aiSetting?.gemini_api_key) {
      return {
        error:
          "AI 보고서를 사용하려면 설정에서 Gemini API 키를 등록해주세요.",
      };
    }

    const currentRange = getMonthRange(parsed.year, parsed.month);
    const previousDate = new Date(parsed.year, parsed.month - 2, 1);
    const previousYear = previousDate.getFullYear();
    const previousMonth = previousDate.getMonth() + 1;
    const previousRange = getMonthRange(previousYear, previousMonth);

    const [
      currentTransactionsResult,
      previousTransactionsResult,
      budgetResult,
      balancesResult,
      assetHistoryResult,
    ] = await Promise.all([
      ctx.supabase.rpc("get_transactions_by_month", {
        p_household_id: ctx.householdId,
        p_start_date: currentRange.start,
        p_end_date: currentRange.end,
      }),
      ctx.supabase.rpc("get_transactions_by_month", {
        p_household_id: ctx.householdId,
        p_start_date: previousRange.start,
        p_end_date: previousRange.end,
      }),
      ctx.supabase
        .from("monthly_budgets")
        .select("total_budget")
        .eq("household_id", ctx.householdId)
        .eq("year", parsed.year)
        .eq("month", parsed.month)
        .maybeSingle(),
      ctx.supabase
        .from("monthly_balances")
        .select("year, month, income_total, expense_total")
        .eq("household_id", ctx.householdId)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(6),
      ctx.supabase
        .from("asset_history")
        .select("record_date, total_net_worth")
        .eq("household_id", ctx.householdId)
        .order("record_date", { ascending: false })
        .limit(2),
    ]);

    const queryError = [
      currentTransactionsResult.error,
      previousTransactionsResult.error,
      budgetResult.error,
      balancesResult.error,
      assetHistoryResult.error,
    ].find(Boolean);
    if (queryError) throw queryError;

    const currentTransactions = mapTransactions(
      (currentTransactionsResult.data ?? []) as TransactionRpcRow[],
    );
    if (currentTransactions.length === 0) {
      return {
        error: "해당 월에 기록된 거래가 없어 보고서를 만들 수 없습니다.",
      };
    }

    const previousTransactions = mapTransactions(
      (previousTransactionsResult.data ?? []) as TransactionRpcRow[],
    );
    const summary = calculateSummary(currentTransactions);
    const fixedExpense = sumExpenseType(currentTransactions, "fixed");
    const variableExpense = sumExpenseType(currentTransactions, "variable");
    const irregularExpense = sumExpenseType(currentTransactions, "irregular");
    const totalBudget = Number(budgetResult.data?.total_budget) || 0;
    const budgetUsagePercent = calculateBudgetUsagePercent(
      totalBudget,
      variableExpense,
    );

    const currentCategories = aggregateExpenseCategories(currentTransactions);
    const previousCategories = aggregateExpenseCategories(previousTransactions);
    const currentCategoryMap = new Map(
      currentCategories.map((category) => [category.name, category]),
    );
    const previousCategoryMap = new Map(
      previousCategories.map((category) => [category.name, category]),
    );
    const categoryNames = new Set([
      ...currentCategoryMap.keys(),
      ...previousCategoryMap.keys(),
    ]);
    const momCategoryDiffs = Array.from(categoryNames)
      .map((name) => {
        const currentCategory = currentCategoryMap.get(name);
        const previousCategory = previousCategoryMap.get(name);
        const currentAmount = currentCategory?.amount ?? 0;
        const previousAmount = previousCategory?.amount ?? 0;
        return {
          name,
          icon: currentCategory?.icon ?? previousCategory?.icon ?? "WalletCards",
          current: currentAmount,
          prev: previousAmount,
          diff: currentAmount - previousAmount,
        };
      })
      .filter((category) => category.diff !== 0)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 5);

    const assetHistory = assetHistoryResult.data ?? [];
    const netWorth =
      assetHistory.length > 0
        ? Number(assetHistory[0].total_net_worth) || 0
        : null;
    const previousNetWorth =
      assetHistory.length > 1
        ? Number(assetHistory[1].total_net_worth) || 0
        : null;
    const netWorthDiff =
      netWorth !== null && previousNetWorth !== null
        ? netWorth - previousNetWorth
        : null;

    const stats: ReportStats = {
      income: summary.income,
      expense: summary.expense,
      balance: summary.balance,
      fixedExpense,
      variableExpense,
      irregularExpense,
      totalBudget,
      budgetUsagePercent,
      momCategoryDiffs,
      netWorth,
      netWorthDiff,
    };

    const categoryExpenses = currentCategories.slice(0, 8).map((category) => ({
      name: category.name,
      icon: category.icon,
      current: category.amount,
      previous: previousCategoryMap.get(category.name)?.amount ?? 0,
    }));

    const aggregates: GeminiReportAggregates = {
      yearMonth: parsed.yearMonth,
      categoryExpenses,
      monthOverMonthHighlights: momCategoryDiffs.map((category) => ({
        name: category.name,
        current: category.current,
        previous: category.prev,
        diff: category.diff,
      })),
      expenseTypeTotals: {
        fixed: fixedExpense,
        variable: variableExpense,
        irregular: irregularExpense,
      },
      income: summary.income,
      totalBudget,
      budgetUsagePercent,
      monthlyTrend: [...(balancesResult.data ?? [])]
        .reverse()
        .map((balance) => ({
          year: Number(balance.year),
          month: Number(balance.month),
          income: Number(balance.income_total) || 0,
          expense: Number(balance.expense_total) || 0,
        })),
      highExpenses: currentTransactions
        .filter((transaction) => transaction.type === "expense")
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map((transaction) => ({
          category: transaction.categoryName,
          amount: transaction.amount,
          date: transaction.date,
        })),
      ...(netWorth !== null
        ? {
            assets: {
              current: netWorth,
              previous: previousNetWorth,
              diff: netWorthDiff,
            },
          }
        : {}),
    };

    const generated = await generateReportContent(
      aiSetting.gemini_api_key,
      aggregates,
    );
    const ai = generated.ok
      ? generated.ai
      : createFallbackReportContent(stats, aggregates);

    const content: MonthlyReportContent = { stats, ai };
    const { error: saveError } = await ctx.supabase.from("monthly_reports").upsert(
      {
        household_id: ctx.householdId,
        year: parsed.year,
        month: parsed.month,
        content,
        model: generated.ok ? GEMINI_MODEL : `${GEMINI_MODEL}+local-fallback`,
        generated_by: ctx.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "household_id,year,month" },
    );
    if (saveError) throw saveError;

    revalidatePath(`/reports/${parsed.yearMonth}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    console.error("월간 AI 보고서 생성 실패:", error);
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function generatePeriodicReport(
  _prevState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };

  const parsed = parsePeriodicReportInput(formData);
  if (!parsed) {
    return { error: "보고서 기간 정보가 올바르지 않습니다." };
  }

  const period = getPeriodRange(parsed.periodType, parsed.periodKey);
  if (period.range.start > getCurrentDateInKorea()) {
    return { error: "미래 기간의 보고서는 만들 수 없습니다." };
  }

  try {
    const { data: aiSetting, error: aiSettingError } = await ctx.supabase
      .from("household_ai_settings")
      .select("gemini_api_key")
      .eq("household_id", ctx.householdId)
      .maybeSingle();
    if (aiSettingError) throw aiSettingError;
    if (!aiSetting?.gemini_api_key) {
      return {
        error:
          "AI 보고서를 사용하려면 설정에서 Gemini API 키를 등록해주세요.",
      };
    }

    const startMonth = Number(period.range.start.slice(5, 7));
    const endMonth = Number(period.range.end.slice(5, 7));
    const options = PERIODIC_REPORT_OPTIONS[period.periodType];
    const [
      currentTransactionsResult,
      previousTransactionsResult,
      budgetsResult,
      balancesResult,
      assetHistoryResult,
    ] = await Promise.all([
      ctx.supabase.rpc("get_transactions_by_month", {
        p_household_id: ctx.householdId,
        p_start_date: period.range.start,
        p_end_date: period.range.end,
      }),
      ctx.supabase.rpc("get_transactions_by_month", {
        p_household_id: ctx.householdId,
        p_start_date: period.previousRange.start,
        p_end_date: period.previousRange.end,
      }),
      ctx.supabase
        .from("monthly_budgets")
        .select("total_budget")
        .eq("household_id", ctx.householdId)
        .eq("year", period.year)
        .gte("month", startMonth)
        .lte("month", endMonth),
      ctx.supabase
        .from("monthly_balances")
        .select("year, month, income_total, expense_total")
        .eq("household_id", ctx.householdId)
        .eq("year", period.year)
        .gte("month", startMonth)
        .lte("month", endMonth)
        .order("month", { ascending: true })
        .limit(options.trendMonths),
      ctx.supabase
        .from("asset_history")
        .select("record_date, total_net_worth")
        .eq("household_id", ctx.householdId)
        .lte("record_date", period.range.end)
        .order("record_date", { ascending: false })
        .limit(2),
    ]);

    const queryError = [
      currentTransactionsResult.error,
      previousTransactionsResult.error,
      budgetsResult.error,
      balancesResult.error,
      assetHistoryResult.error,
    ].find(Boolean);
    if (queryError) throw queryError;

    const currentTransactions = mapTransactions(
      (currentTransactionsResult.data ?? []) as TransactionRpcRow[],
    );
    if (currentTransactions.length === 0) {
      return {
        error: "선택한 기간에 기록된 거래가 없어 보고서를 만들 수 없습니다.",
      };
    }

    const previousTransactions = mapTransactions(
      (previousTransactionsResult.data ?? []) as TransactionRpcRow[],
    );
    const summary = calculateSummary(currentTransactions);
    const fixedExpense = sumExpenseType(currentTransactions, "fixed");
    const variableExpense = sumExpenseType(currentTransactions, "variable");
    const irregularExpense = sumExpenseType(currentTransactions, "irregular");
    const totalBudget = (budgetsResult.data ?? []).reduce(
      (sum, budget) => sum + (Number(budget.total_budget) || 0),
      0,
    );
    const budgetUsagePercent = calculateBudgetUsagePercent(
      totalBudget,
      variableExpense,
    );

    const currentCategories = aggregateExpenseCategories(currentTransactions);
    const previousCategories = aggregateExpenseCategories(previousTransactions);
    const currentCategoryMap = new Map(
      currentCategories.map((category) => [category.name, category]),
    );
    const previousCategoryMap = new Map(
      previousCategories.map((category) => [category.name, category]),
    );
    const categoryNames = new Set([
      ...currentCategoryMap.keys(),
      ...previousCategoryMap.keys(),
    ]);
    const momCategoryDiffs = Array.from(categoryNames)
      .map((name) => {
        const currentCategory = currentCategoryMap.get(name);
        const previousCategory = previousCategoryMap.get(name);
        const currentAmount = currentCategory?.amount ?? 0;
        const previousAmount = previousCategory?.amount ?? 0;
        return {
          name,
          icon: currentCategory?.icon ?? previousCategory?.icon ?? "WalletCards",
          current: currentAmount,
          prev: previousAmount,
          diff: currentAmount - previousAmount,
        };
      })
      .filter((category) => category.diff !== 0)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 5);

    const assetHistory = assetHistoryResult.data ?? [];
    const netWorth =
      assetHistory.length > 0
        ? Number(assetHistory[0].total_net_worth) || 0
        : null;
    const previousNetWorth =
      assetHistory.length > 1
        ? Number(assetHistory[1].total_net_worth) || 0
        : null;
    const netWorthDiff =
      netWorth !== null && previousNetWorth !== null
        ? netWorth - previousNetWorth
        : null;

    const stats: ReportStats = {
      periodLabel: period.periodLabel,
      previousPeriodLabel: period.previousPeriodLabel,
      income: summary.income,
      expense: summary.expense,
      balance: summary.balance,
      fixedExpense,
      variableExpense,
      irregularExpense,
      totalBudget,
      budgetUsagePercent,
      momCategoryDiffs,
      netWorth,
      netWorthDiff,
    };

    const categoryExpenses = currentCategories
      .slice(0, options.detailLimit)
      .map((category) => ({
        name: category.name,
        icon: category.icon,
        current: category.amount,
        previous: previousCategoryMap.get(category.name)?.amount ?? 0,
      }));

    const aggregates: GeminiReportAggregates = {
      periodLabel: period.periodLabel,
      previousPeriodLabel: period.previousPeriodLabel,
      yearMonth: period.periodKey,
      categoryExpenses,
      monthOverMonthHighlights: momCategoryDiffs.map((category) => ({
        name: category.name,
        current: category.current,
        previous: category.prev,
        diff: category.diff,
      })),
      expenseTypeTotals: {
        fixed: fixedExpense,
        variable: variableExpense,
        irregular: irregularExpense,
      },
      income: summary.income,
      totalBudget,
      budgetUsagePercent,
      monthlyTrend: (balancesResult.data ?? []).map((balance) => ({
        year: Number(balance.year),
        month: Number(balance.month),
        income: Number(balance.income_total) || 0,
        expense: Number(balance.expense_total) || 0,
      })),
      highExpenses: currentTransactions
        .filter((transaction) => transaction.type === "expense")
        .sort((a, b) => b.amount - a.amount)
        .slice(0, options.detailLimit)
        .map((transaction) => ({
          category: transaction.categoryName,
          amount: transaction.amount,
          date: transaction.date,
        })),
      ...(netWorth !== null
        ? {
            assets: {
              current: netWorth,
              previous: previousNetWorth,
              diff: netWorthDiff,
            },
          }
        : {}),
    };

    const generated = await generateReportContent(
      aiSetting.gemini_api_key,
      aggregates,
    );
    const ai = generated.ok
      ? generated.ai
      : createFallbackReportContent(stats, aggregates);

    const content: MonthlyReportContent = { stats, ai };
    const { error: saveError } = await ctx.supabase
      .from("periodic_reports")
      .upsert(
        {
          household_id: ctx.householdId,
          period_type: period.periodType,
          year: period.year,
          period_key: period.periodKey,
          content,
          model: generated.ok
            ? GEMINI_MODEL
            : `${GEMINI_MODEL}+local-fallback`,
          generated_by: ctx.user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "household_id,period_type,period_key" },
      );
    if (saveError) throw saveError;

    revalidatePath(`/reports/${period.periodKey}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    console.error("기간 AI 보고서 생성 실패:", error);
    return { error: getKoreanErrorMessage(error) };
  }
}
