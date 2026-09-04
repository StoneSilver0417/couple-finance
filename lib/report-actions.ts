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
import type { MonthlyReportContent, ReportStats } from "@/types/report";

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

    if (aiSettingError) {
      console.error("[REPORT_GEN] Error fetching AI setting:", aiSettingError);
      throw aiSettingError;
    }

    console.log(`[REPORT_GEN] householdId: ${ctx.householdId}`);
    console.log(`[REPORT_GEN] aiSetting found: ${!!aiSetting}`);
    console.log(`[REPORT_GEN] apiKey length: ${aiSetting?.gemini_api_key?.length || 0}`);

    const apiKey = aiSetting?.gemini_api_key || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;


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
      currentAssetResult,
      previousAssetResult,
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
      // 보고 대상 월 말 기준 최신 순자산(최근이 아니라 그 달까지의 기록)
      ctx.supabase
        .from("asset_history")
        .select("record_date, total_net_worth")
        .eq("household_id", ctx.householdId)
        .lte("record_date", currentRange.end)
        .order("record_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      // 그 달이 시작되기 전 최신 순자산(전월 대비 증감 계산용)
      ctx.supabase
        .from("asset_history")
        .select("record_date, total_net_worth")
        .eq("household_id", ctx.householdId)
        .lt("record_date", currentRange.start)
        .order("record_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const queryError = [
      currentTransactionsResult.error,
      previousTransactionsResult.error,
      budgetResult.error,
      balancesResult.error,
      currentAssetResult.error,
      previousAssetResult.error,
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
    // 전월에 지출 기록이 아예 없으면(가입 첫 달 등) 모든 카테고리가 "신규 증가"로
    // 잡혀 "전월 대비 늘었다"는 잘못된 서술이 나온다. 이럴 땐 비교를 생략한다.
    const hasComparisonBaseline = previousCategories.length > 0;
    const momCategoryDiffs = hasComparisonBaseline
      ? Array.from(categoryNames)
          .map((name) => {
            const currentCategory = currentCategoryMap.get(name);
            const previousCategory = previousCategoryMap.get(name);
            const currentAmount = currentCategory?.amount ?? 0;
            const previousAmount = previousCategory?.amount ?? 0;
            return {
              name,
              icon:
                currentCategory?.icon ?? previousCategory?.icon ?? "WalletCards",
              current: currentAmount,
              prev: previousAmount,
              diff: currentAmount - previousAmount,
            };
          })
          .filter((category) => category.diff !== 0)
          .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
          .slice(0, 5)
      : [];

    const netWorth = currentAssetResult.data
      ? Number(currentAssetResult.data.total_net_worth) || 0
      : null;
    const previousNetWorth = previousAssetResult.data
      ? Number(previousAssetResult.data.total_net_worth) || 0
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
      hasComparisonBaseline,
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

    // Gemini API 호출 (폴백 대신 에러 반환)
    if (!apiKey || apiKey.length < 20) {
      return { error: "Gemini API 키가 설정되지 않았거나 올바르지 않습니다. 설정에서 API 키를 등록해주세요." };
    }

    const res = await generateReportContent(apiKey, aggregates);
    if (!res.ok) {
      return { error: `AI 보고서 생성 실패: ${res.error}` };
    }

    const aiContent = res.ai;
    const content: MonthlyReportContent = { stats, ai: aiContent };
    const { error: saveError } = await ctx.supabase.from("monthly_reports").upsert(
      {
        household_id: ctx.householdId,
        year: parsed.year,
        month: parsed.month,
        content,
        model: GEMINI_MODEL,
        generated_by: ctx.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "household_id,year,month" },
    );
    if (saveError) throw saveError;

    // Force revalidation for the UI
    console.log("[REPORT_GEN] Forcing revalidation for ", parsed.yearMonth);

    revalidatePath(`/reports/${parsed.yearMonth}`);
    revalidatePath("/", "layout");
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

    if (aiSettingError) {
      console.error("[REPORT_GEN] Error fetching AI setting:", aiSettingError);
      throw aiSettingError;
    }

    console.log(`[REPORT_GEN] householdId: ${ctx.householdId}`);
    console.log(`[REPORT_GEN] aiSetting found: ${!!aiSetting}`);
    console.log(`[REPORT_GEN] apiKey length: ${aiSetting?.gemini_api_key?.length || 0}`);

    const apiKey = aiSetting?.gemini_api_key || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;


    const startMonth = Number(period.range.start.slice(5, 7));
    const endMonth = Number(period.range.end.slice(5, 7));
    const options = PERIODIC_REPORT_OPTIONS[period.periodType];
    const [
      currentTransactionsResult,
      previousTransactionsResult,
      budgetsResult,
      balancesResult,
      currentAssetResult,
      previousAssetResult,
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
      // 보고 대상 기간 말 기준 최신 순자산(최근이 아니라 그 기간까지의 기록)
      ctx.supabase
        .from("asset_history")
        .select("record_date, total_net_worth")
        .eq("household_id", ctx.householdId)
        .lte("record_date", period.range.end)
        .order("record_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      // 그 기간이 시작되기 전 최신 순자산(전기간 대비 증감 계산용)
      ctx.supabase
        .from("asset_history")
        .select("record_date, total_net_worth")
        .eq("household_id", ctx.householdId)
        .lt("record_date", period.range.start)
        .order("record_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const queryError = [
      currentTransactionsResult.error,
      previousTransactionsResult.error,
      budgetsResult.error,
      balancesResult.error,
      currentAssetResult.error,
      previousAssetResult.error,
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
    // 직전 기간에 지출 기록이 아예 없으면(가입 초기 등) 모든 카테고리가 "신규 증가"로
    // 잡혀 "전기간 대비 늘었다"는 잘못된 서술이 나온다. 이럴 땐 비교를 생략한다.
    const hasComparisonBaseline = previousCategories.length > 0;
    const momCategoryDiffs = hasComparisonBaseline
      ? Array.from(categoryNames)
          .map((name) => {
            const currentCategory = currentCategoryMap.get(name);
            const previousCategory = previousCategoryMap.get(name);
            const currentAmount = currentCategory?.amount ?? 0;
            const previousAmount = previousCategory?.amount ?? 0;
            return {
              name,
              icon:
                currentCategory?.icon ?? previousCategory?.icon ?? "WalletCards",
              current: currentAmount,
              prev: previousAmount,
              diff: currentAmount - previousAmount,
            };
          })
          .filter((category) => category.diff !== 0)
          .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
          .slice(0, 5)
      : [];

    const netWorth = currentAssetResult.data
      ? Number(currentAssetResult.data.total_net_worth) || 0
      : null;
    const previousNetWorth = previousAssetResult.data
      ? Number(previousAssetResult.data.total_net_worth) || 0
      : null;
    const netWorthDiff =
      netWorth !== null && previousNetWorth !== null
        ? netWorth - previousNetWorth
        : null;

    // 연간 요약 페이지와 동일하게, 잔액을 "실제 기록이 있는 개월수"로 나눈 월평균으로
    // 보여주기 위해 기간 내 monthly_balances 로우 수를 함께 저장한다.
    const periodMonthsWithData = balancesResult.data?.length ?? 0;

    const stats: ReportStats = {
      periodLabel: period.periodLabel,
      previousPeriodLabel: period.previousPeriodLabel,
      periodMonthsWithData,
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
      hasComparisonBaseline,
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

    // Gemini API 호출 (폴백 대신 에러 반환)
    if (!apiKey || apiKey.length < 20) {
      return { error: "Gemini API 키가 설정되지 않았거나 올바르지 않습니다. 설정에서 API 키를 등록해주세요." };
    }

    const res = await generateReportContent(apiKey, aggregates);
    if (!res.ok) {
      return { error: `AI 보고서 생성 실패: ${res.error}` };
    }

    const aiContent = res.ai;
    const content: MonthlyReportContent = { stats, ai: aiContent };
    const { error: saveError } = await ctx.supabase
      .from("periodic_reports")
      .upsert(
        {
          household_id: ctx.householdId,
          period_type: period.periodType,
          year: period.year,
          period_key: period.periodKey,
          content,
          model: GEMINI_MODEL,
          generated_by: ctx.user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "household_id,period_type,period_key" },
      );
    if (saveError) throw saveError;

    // Force revalidation for the UI
    console.log("[REPORT_GEN] Forcing revalidation for ", period.periodKey);

    revalidatePath(`/reports/${period.periodKey}`);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: unknown) {
    console.error("기간 AI 보고서 생성 실패:", error);
    return { error: getKoreanErrorMessage(error) };
  }
}
