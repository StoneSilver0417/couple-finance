"use server";

import { revalidatePath } from "next/cache";
import { getHouseholdContext } from "@/lib/supabase/household-context";
import { getKoreanErrorMessage } from "@/lib/error-messages";
import { logActivity } from "./activity-log";
import { isValidAmount, isValidYearMonth } from "@/lib/validation";

export async function updateBudget(
  categoryId: string,
  year: number,
  month: number,
  amount: number,
) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  // 서버 액션 인자는 외부 입력이므로 검증
  if (!categoryId || !isValidYearMonth(year, month)) {
    return { error: "예산 설정 정보가 올바르지 않습니다." };
  }
  if (!isValidAmount(amount)) {
    return { error: "예산 금액이 올바르지 않습니다." };
  }

  try {
    const { error } = await supabase.from("budgets").upsert(
      {
        household_id: householdId,
        category_id: categoryId,
        year,
        month,
        budget_amount: amount,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "household_id, category_id, year, month",
      },
    );

    if (error) throw error;

    // 활동 기록
    await logActivity(
      supabase,
      householdId,
      user.id,
      "UPDATE",
      "BUDGET",
      `${year}년 ${month}월 예산 ₩${Math.round(amount).toLocaleString("ko-KR")} 설정`,
    );

    revalidatePath("/settings/budgets");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}
