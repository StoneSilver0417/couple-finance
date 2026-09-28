"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { syncMonthlyBalance } from "@/lib/balance-actions";
import { getKoreanErrorMessage } from "@/lib/error-messages";
import { getHouseholdContext } from "@/lib/supabase/household-context";

export async function materializeMonthlyRecurringTransactions(year: number, month: number) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, householdId } = ctx;

  const yearParsed = z.number().int().min(2000).max(2100).safeParse(year);
  const monthParsed = z.number().int().min(1).max(12).safeParse(month);

  if (!yearParsed.success || !monthParsed.success) return { error: "유효하지 않은 연도 또는 월입니다." };

  try {
    const { data, error } = await supabase.rpc("materialize_monthly_recurring_transactions", {
      p_year: year,
      p_month: month,
    });

    if (error) throw error;

    const rpcResultSchema = z.object({
      success: z.boolean(),
      processed_count: z.number(),
      year: z.number(),
      month: z.number(),
    });
    const parsed = rpcResultSchema.safeParse(data);
    if (!parsed.success) {
      return { error: "반복 거래 생성 결과가 올바르지 않습니다." };
    }

    if (parsed.data.processed_count > 0) {
      await syncMonthlyBalance(supabase, householdId, year, month);
      revalidatePath("/");
      revalidatePath("/transactions");
    }

    return { success: true, processed_count: parsed.data.processed_count };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}
