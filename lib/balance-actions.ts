"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Recalculates and saves the summary for a specific month.
 */
export async function syncMonthlyBalance(
  householdId: string,
  year: number,
  month: number,
) {
  const supabase = await createClient();

  // 1. Calculate totals for the target month
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { data: txs } = await supabase
    .from("transactions")
    .select("type, amount")
    .eq("household_id", householdId)
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate);

  const incomeTotal =
    txs
      ?.filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const expenseTotal =
    txs
      ?.filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  // 2. Fetch previous month's balance for carry-over
  const prevDate = new Date(year, month - 2, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;

  const { data: prevBalance } = await supabase
    .from("monthly_balances")
    .select("current_balance")
    .eq("household_id", householdId)
    .eq("year", prevYear)
    .eq("month", prevMonth)
    .single();

  const carryOverAmount = prevBalance?.current_balance || 0;
  const currentBalance = carryOverAmount + incomeTotal - expenseTotal;

  // 3. Upsert monthly balance
  const { error } = await supabase.from("monthly_balances").upsert(
    {
      household_id: householdId,
      year,
      month,
      income_total: incomeTotal,
      expense_total: expenseTotal,
      carry_over_amount: carryOverAmount,
      current_balance: currentBalance,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "household_id, year, month",
    },
  );

  if (error) throw error;

  // 4. Recursively update next month if exists (to propagate carry-over)
  // This is a simplified version. In production, you might want to limit this or use a trigger/worker.
  const nextDate = new Date(year, month, 1);
  const nextYear = nextDate.getFullYear();
  const nextMonth = nextDate.getMonth() + 1;

  const { data: nextExists } = await supabase
    .from("monthly_balances")
    .select("id")
    .eq("household_id", householdId)
    .eq("year", nextYear)
    .eq("month", nextMonth)
    .single();

  if (nextExists) {
    await syncMonthlyBalance(householdId, nextYear, nextMonth);
  }

  return { incomeTotal, expenseTotal, carryOverAmount, currentBalance };
}
