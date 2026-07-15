import { Transaction, MonthlySummary, ChartDataPoint } from "@/types";

/**
 * Calculates the total amount for a list of transactions
 */
export function calculateTotal(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
}

/**
 * Groups transactions by type (income/expense) and calculates totals
 */
export function calculateSummary(
  transactions: Array<Pick<Transaction, "type" | "amount">>,
): MonthlySummary {
  const income = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const expense = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  return {
    income,
    expense,
    balance: income - expense,
    carryOver: 0, // Placeholder if needed
  };
}

/**
 * 설정한 월 예산 대비 변동지출 사용률을 계산한다.
 * 고정·비정기 지출은 홈 지출 분석과 동일하게 예산 사용액에서 제외한다.
 */
export function calculateBudgetUsagePercent(
  totalBudget: number,
  variableExpense: number,
): number | null {
  if (totalBudget <= 0) return null;
  return (variableExpense / totalBudget) * 100;
}

/**
 * Groups transactions by category for charting
 */
export function groupByCategory(transactions: Transaction[]): ChartDataPoint[] {
  const groups: Record<string, ChartDataPoint> = {};

  transactions.forEach((tx) => {
    // Safety check: categories might be missing or join might have failed
    const name = tx.categories?.name || "미분류";
    const color = tx.categories?.color || "#cbd5e1";
    const icon = tx.categories?.icon || "💰";

    if (!groups[name]) {
      groups[name] = { name, value: 0, color, icon };
    }
    groups[name].value += Number(tx.amount);
  });

  return Object.values(groups).sort((a, b) => b.value - a.value);
}
