"use server";

import { revalidatePath } from "next/cache";
import { getHouseholdContext } from "@/lib/supabase/household-context";
import { getKoreanErrorMessage } from "@/lib/error-messages";
import { isValidAmount, isValidYearMonth } from "@/lib/validation";

export async function updateMonthlyBudget(
  year: number,
  month: number,
  amount: number,
) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, householdId } = ctx;

  // 서버 액션 인자는 외부 입력이므로 검증
  if (!isValidYearMonth(year, month)) {
    return { error: "연도/월 정보가 올바르지 않습니다." };
  }
  if (!isValidAmount(amount)) {
    return { error: "예산 금액이 올바르지 않습니다." };
  }

  try {
    const { error } = await supabase.from("monthly_budgets").upsert(
      {
        household_id: householdId,
        year,
        month,
        total_budget: amount,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "household_id, year, month",
      },
    );

    if (error) throw error;

    revalidatePath("/settings/budgets");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    console.error("월 예산 설정 실패:", error);
    return { error: getKoreanErrorMessage(error) };
  }
}
