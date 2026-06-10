// 월별 잔액 동기화 내부 모듈 (서버 전용 — "use server" 아님)
// 기존에는 공개 서버 액션으로 노출되어 인증 없이 임의 가구 ID로
// 호출이 가능했음 → 서버 내부 함수로 격리하고 호출자의 클라이언트를 전달받는다.

import type { ServerSupabaseClient } from "@/lib/supabase/household-context";

/**
 * 특정 월의 수입/지출 합계와 이월 잔액을 재계산해 저장한다.
 * 다음 달 레코드가 있으면 이월액 전파를 위해 재귀적으로 갱신한다.
 */
export async function syncMonthlyBalance(
  supabase: ServerSupabaseClient,
  householdId: string,
  year: number,
  month: number,
) {
  // 1. 해당 월의 거래 합계 계산
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

  // 2. 전월 잔액 조회 (이월액)
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

  // 3. 월별 잔액 UPSERT
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

  // 4. 다음 달 레코드가 있으면 이월액 전파를 위해 재귀 갱신
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
    await syncMonthlyBalance(supabase, householdId, nextYear, nextMonth);
  }

  return { incomeTotal, expenseTotal, carryOverAmount, currentBalance };
}
