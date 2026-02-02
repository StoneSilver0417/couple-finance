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
export function calculateSummary(transactions: Transaction[]): MonthlySummary {
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
