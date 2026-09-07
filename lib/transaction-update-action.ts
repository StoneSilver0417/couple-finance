"use server";

import { revalidatePath } from "next/cache";
import { getHouseholdContext } from "@/lib/supabase/household-context";
import { syncMonthlyBalance } from "./balance-actions";
import { logActivity } from "./activity-log";
import { categoryBelongsToHousehold } from "./transaction-validation";
import { getKoreanErrorMessage } from "@/lib/error-messages";
import { transactionSchema } from "@/lib/schemas";
import {
  getTrimmedString,
  isExpenseType,
  isTransactionType,
  isValidDateString,
  parsePositiveAmount,
} from "@/lib/validation";

export async function updateTransaction(
  transactionId: string,
  formData: FormData,
) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  const { data: oldTx } = await supabase
    .from("transactions")
    .select("household_id, transaction_date, recurring_rule_id, is_recurring, type, amount, memo")
    .eq("id", transactionId)
    .single();

  if (!oldTx || oldTx.household_id !== householdId) {
    return { error: "거래 정보를 찾을 수 없거나 수정 권한이 없습니다." };
  }

  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    amount: Number(formData.get("amount")),
    category_id: formData.get("category_id"),
    transaction_date: formData.get("transaction_date"),
    memo: formData.get("memo") || undefined,
    expense_type: formData.get("expense_type") || undefined,
    recurring_enabled: formData.get("recurring_enabled") === "true",
    recurring_end_date: formData.get("recurring_end_date") || undefined,
    update_recurring_rule: formData.get("update_recurring_rule") !== "false",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "입력값이 유효하지 않습니다." };
  }

  const type = formData.get("type");
  const amount = parsePositiveAmount(formData.get("amount"));
  const categoryId = getTrimmedString(formData.get("category_id"), 64);
  const transactionDate = formData.get("transaction_date");
  const memo = getTrimmedString(formData.get("memo"), 500);

  if (!isTransactionType(type)) {
    return { error: "거래 유형이 올바르지 않습니다." };
  }
  if (amount === null) {
    return { error: "금액은 0보다 큰 정상적인 값이어야 합니다." };
  }
  if (!categoryId || !isValidDateString(transactionDate)) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  const rawExpenseType = formData.get("expense_type");
  const expenseType =
    type === "expense" && isExpenseType(rawExpenseType) ? rawExpenseType : null;

  if (type === "expense" && !expenseType) {
    return { error: "지출 유형이 올바르지 않습니다." };
  }

  try {
    const categoryIsValid = await categoryBelongsToHousehold(
      supabase,
      householdId,
      categoryId,
    );
    if (!categoryIsValid) {
      return { error: "카테고리 정보가 올바르지 않습니다." };
    }

    let nextRecurringRuleId: string | null = oldTx.recurring_rule_id;
    let recurringLogNote = "";
    const txDate = new Date(transactionDate);
    const targetDay = txDate.getDate();

    if (parsed.data.recurring_enabled) {
      if (!oldTx.recurring_rule_id) {
        const { data: newRule, error: newRuleError } = await supabase
          .from("recurring_rules")
          .insert({
            household_id: householdId,
            user_id: user.id,
            type,
            expense_type: expenseType,
            amount,
            category_id: categoryId,
            memo,
            target_day: targetDay,
            start_date: transactionDate,
            end_date: parsed.data.recurring_end_date || null,
            is_active: true,
          })
          .select("id")
          .single();

        if (newRuleError || !newRule) {
          throw newRuleError || new Error("반복 규칙 생성에 실패했습니다.");
        }

        nextRecurringRuleId = newRule.id;

        await supabase.from("recurring_occurrences").upsert(
          {
            rule_id: newRule.id,
            transaction_id: transactionId,
            target_year: txDate.getFullYear(),
            target_month: txDate.getMonth() + 1,
          },
          { onConflict: "rule_id,target_year,target_month" },
        );

        recurringLogNote = " (반복 거래 연동 등록)";
      } else if (parsed.data.update_recurring_rule) {
        const { error: ruleUpdateError } = await supabase
          .from("recurring_rules")
          .update({
            type,
            expense_type: expenseType,
            amount,
            category_id: categoryId,
            memo,
            target_day: targetDay,
            end_date: parsed.data.recurring_end_date || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", oldTx.recurring_rule_id)
          .eq("household_id", householdId);

        if (ruleUpdateError) throw ruleUpdateError;

        const oldDateObj = new Date(oldTx.transaction_date);
        if (
          oldDateObj.getFullYear() !== txDate.getFullYear() ||
          oldDateObj.getMonth() !== txDate.getMonth()
        ) {
          await supabase
            .from("recurring_occurrences")
            .update({
              target_year: txDate.getFullYear(),
              target_month: txDate.getMonth() + 1,
            })
            .eq("rule_id", oldTx.recurring_rule_id)
            .eq("transaction_id", transactionId);
        }

        recurringLogNote = " (반복 규칙 동기화)";
      }
    } else {
      if (oldTx.recurring_rule_id) {
        nextRecurringRuleId = null;

        await supabase
          .from("recurring_occurrences")
          .delete()
          .eq("rule_id", oldTx.recurring_rule_id)
          .eq("transaction_id", transactionId);

        recurringLogNote = " (반복 거래 연동 해제)";
      }
    }

    const { error: txUpdateError } = await supabase
      .from("transactions")
      .update({
        type,
        expense_type: expenseType,
        amount,
        category_id: categoryId,
        transaction_date: transactionDate,
        memo,
        recurring_rule_id: nextRecurringRuleId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId)
      .eq("household_id", householdId);

    if (txUpdateError) throw txUpdateError;

    if (oldTx.transaction_date !== transactionDate) {
      const oldDate = new Date(oldTx.transaction_date);
      await syncMonthlyBalance(
        supabase,
        householdId,
        oldDate.getFullYear(),
        oldDate.getMonth() + 1,
      );
    }

    await syncMonthlyBalance(
      supabase,
      householdId,
      txDate.getFullYear(),
      txDate.getMonth() + 1,
    );

    const typeLabel = type === "income" ? "수입" : "지출";
    const amountStr = Math.round(amount).toLocaleString("ko-KR");
    await logActivity(
      supabase,
      householdId,
      user.id,
      "UPDATE",
      "TRANSACTION",
      `${typeLabel} ₩${amountStr} 수정${memo ? ` - ${memo}` : ""}${recurringLogNote}`,
    );

    revalidatePath("/transactions");
    revalidatePath("/settings/recurring-transactions");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}
