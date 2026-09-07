"use server";

import { revalidatePath } from "next/cache";
import { getHouseholdContext } from "@/lib/supabase/household-context";
import { recurringRuleSchema } from "@/lib/schemas";
import { getKoreanErrorMessage } from "@/lib/error-messages";
import { validateCategoryCompatibility } from "@/lib/transaction-validation";
import { syncMonthlyBalance } from "@/lib/balance-actions";
import { logActivity } from "@/lib/activity-log";
import { z } from "zod";

const idSchema = z.string().uuid("유효하지 않은 ID입니다.");

function parseFormData(formData: FormData) {
  const type = formData.get("type");
  const rawExpenseType = formData.get("expense_type");
  return recurringRuleSchema.safeParse({
    type,
    expense_type: type === "expense" ? (rawExpenseType || undefined) : null,
    amount: Number(formData.get("amount")),
    category_id: formData.get("category_id"),
    memo: formData.get("memo") || undefined,
    target_day: Number(formData.get("target_day")),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date") || undefined,
    is_active: formData.get("is_active") === "true",
  });
}

export async function listRecurringRules() {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, householdId } = ctx;

  try {
    const { data, error } = await supabase
      .from("recurring_rules")
      .select(`*, categories (name, icon, color)`)
      .eq("household_id", householdId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function getRecurringRule(id: string) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, householdId } = ctx;

  const idParsed = idSchema.safeParse(id);
  if (!idParsed.success) return { error: idParsed.error.issues[0]?.message };

  try {
    const { data, error } = await supabase
      .from("recurring_rules")
      .select(`*, categories (name, icon, color)`)
      .eq("id", id)
      .eq("household_id", householdId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { error: "반복 거래를 찾을 수 없거나 권한이 없습니다." };
    return { data };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function createRecurringRule(formData: FormData) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  const parsed = parseFormData(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "입력값이 유효하지 않습니다." };
  const data = parsed.data;

  try {
    const compatibility = await validateCategoryCompatibility(
      supabase,
      householdId,
      data.category_id,
      data.type,
      data.expense_type || undefined
    );
    if (!compatibility.valid) return { error: compatibility.error };

    const { error } = await supabase.from("recurring_rules").insert({
      household_id: householdId,
      user_id: user.id,
      type: data.type,
      expense_type: data.type === "expense" ? (data.expense_type ?? null) : null,
      amount: data.amount,
      category_id: data.category_id,
      memo: data.memo || null,
      target_day: data.target_day,
      start_date: data.start_date,
      end_date: data.end_date || null,
      is_active: data.is_active,
    });

    if (error) throw error;

    const typeLabel = data.type === "income" ? "수입" : "지출";
    const amountStr = Math.round(data.amount).toLocaleString("ko-KR");
    await logActivity(
      supabase, householdId, user.id, "CREATE", "RECURRING_RULE",
      `반복 ${typeLabel} ₩${amountStr} 추가${data.memo ? ` - ${data.memo}` : ""}`
    );

    revalidatePath("/settings/recurring-transactions");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function updateRecurringRule(id: string, formData: FormData) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  const idParsed = idSchema.safeParse(id);
  if (!idParsed.success) return { error: idParsed.error.issues[0]?.message };

  const parsed = parseFormData(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "입력값이 유효하지 않습니다." };
  const data = parsed.data;

  try {
    const { data: existing, error: fetchError } = await supabase
      .from("recurring_rules")
      .select("id")
      .eq("id", id)
      .eq("household_id", householdId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) return { error: "반복 거래를 찾을 수 없거나 권한이 없습니다." };

    const compatibility = await validateCategoryCompatibility(
      supabase,
      householdId,
      data.category_id,
      data.type,
      data.expense_type || undefined
    );
    if (!compatibility.valid) return { error: compatibility.error };

    const { error } = await supabase
      .from("recurring_rules")
      .update({
        type: data.type,
        expense_type: data.type === "expense" ? (data.expense_type ?? null) : null,
        amount: data.amount,
        category_id: data.category_id,
        memo: data.memo || null,
        target_day: data.target_day,
        start_date: data.start_date,
        end_date: data.end_date || null,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("household_id", householdId);

    if (error) throw error;

    const typeLabel = data.type === "income" ? "수입" : "지출";
    const amountStr = Math.round(data.amount).toLocaleString("ko-KR");
    await logActivity(
      supabase, householdId, user.id, "UPDATE", "RECURRING_RULE",
      `반복 ${typeLabel} ₩${amountStr} 수정`
    );

    revalidatePath("/settings/recurring-transactions");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function toggleRecurringRule(id: string, isActive: boolean) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  const idParsed = idSchema.safeParse(id);
  if (!idParsed.success) return { error: idParsed.error.issues[0]?.message };

  try {
    const { data: existing, error: fetchError } = await supabase
      .from("recurring_rules")
      .select("id, memo")
      .eq("id", id)
      .eq("household_id", householdId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) return { error: "반복 거래를 찾을 수 없거나 권한이 없습니다." };

    const { error } = await supabase
      .from("recurring_rules")
      .update({ is_active: isActive })
      .eq("id", id)
      .eq("household_id", householdId);

    if (error) throw error;

    await logActivity(
      supabase, householdId, user.id, "UPDATE", "RECURRING_RULE",
      `반복 거래 ${isActive ? "활성화" : "비활성화"}${existing.memo ? ` - ${existing.memo}` : ""}`
    );

    revalidatePath("/settings/recurring-transactions");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function deleteRecurringRule(id: string) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  const idParsed = idSchema.safeParse(id);
  if (!idParsed.success) return { error: idParsed.error.issues[0]?.message };

  try {
    const { data: existing, error: fetchError } = await supabase
      .from("recurring_rules")
      .select("id, memo")
      .eq("id", id)
      .eq("household_id", householdId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) return { error: "반복 거래를 찾을 수 없거나 권한이 없습니다." };

    const { error } = await supabase
      .from("recurring_rules")
      .delete()
      .eq("id", id)
      .eq("household_id", householdId);

    if (error) throw error;

    await logActivity(
      supabase, householdId, user.id, "DELETE", "RECURRING_RULE",
      `반복 거래 삭제${existing.memo ? ` - ${existing.memo}` : ""}`
    );

    revalidatePath("/settings/recurring-transactions");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

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

    if (!error && data) {
      const rpcResultSchema = z.object({
        success: z.boolean(),
        processed_count: z.number(),
        year: z.number(),
        month: z.number(),
      });
      const parsed = rpcResultSchema.safeParse(data);
      if (parsed.success && parsed.data.processed_count > 0) {
        await syncMonthlyBalance(supabase, householdId, year, month);
        revalidatePath("/");
        revalidatePath("/transactions");
      }
      return { success: true, processed_count: parsed.success ? parsed.data.processed_count : 0 };
    }

    // RPC 실패 시 JS Fallback 실행
    const monthStr = String(month).padStart(2, "0");
    const occurrenceMonthStr = `${year}-${monthStr}`;
    const startOfMonth = `${year}-${monthStr}-01`;
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const endOfMonth = `${year}-${monthStr}-${String(lastDayOfMonth).padStart(2, "0")}`;

    // 1. 활성화된 반복 규칙 조회
    const { data: rules } = await supabase
      .from("recurring_rules")
      .select("*")
      .eq("household_id", householdId)
      .eq("is_active", true)
      .lte("start_date", endOfMonth);

    if (!rules || rules.length === 0) return { success: true, processed_count: 0 };

    // 2. 이미 생성된 이력 조회
    const { data: occurrences } = await supabase
      .from("recurring_occurrences")
      .select("recurring_rule_id")
      .eq("household_id", householdId)
      .eq("occurrence_month", occurrenceMonthStr);

    const existingRuleIds = new Set((occurrences || []).map((o) => o.recurring_rule_id));

    let processedCount = 0;

    for (const rule of rules) {
      if (rule.end_date && rule.end_date < startOfMonth) continue;
      if (existingRuleIds.has(rule.id)) continue;

      const targetDay = Math.min(rule.target_day, lastDayOfMonth);
      const targetDate = `${year}-${monthStr}-${String(targetDay).padStart(2, "0")}`;

      if (targetDate < rule.start_date) continue;
      if (rule.end_date && targetDate > rule.end_date) continue;

      // 거래 생성
      const { data: tx, error: txErr } = await supabase
        .from("transactions")
        .insert({
          household_id: householdId,
          user_id: rule.user_id || ctx.user.id,
          type: rule.type,
          expense_type: rule.expense_type,
          amount: rule.amount,
          category_id: rule.category_id,
          memo: rule.memo,
          transaction_date: targetDate,
          recurring_rule_id: rule.id,
        })
        .select("id")
        .single();

      if (txErr || !tx) continue;

      // 이력 추가
      await supabase.from("recurring_occurrences").insert({
        household_id: householdId,
        recurring_rule_id: rule.id,
        occurrence_month: occurrenceMonthStr,
        transaction_id: tx.id,
      });

      processedCount++;
    }

    if (processedCount > 0) {
      await syncMonthlyBalance(supabase, householdId, year, month);
      revalidatePath("/");
      revalidatePath("/transactions");
    }

    return { success: true, processed_count: processedCount };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}
