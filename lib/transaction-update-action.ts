"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getHouseholdContext } from "@/lib/supabase/household-context";
import { syncMonthlyBalance } from "./balance-actions";
import { logActivity } from "./activity-log";
import { categoryBelongsToHousehold } from "./transaction-validation";
import { getKoreanErrorMessage } from "@/lib/error-messages";
import { transactionSchema } from "@/lib/schemas";
import { parseTransactionDate } from "@/lib/transaction-date";
import { updateRecurringTransactionRpcArgs } from "@/lib/recurring/transaction-rpc";
import {
  getTrimmedString,
  isExpenseType,
  isTransactionType,
  isValidDateString,
  parsePositiveAmount,
} from "@/lib/validation";

const transactionIdSchema = z.string().uuid("유효하지 않은 거래 ID입니다.");

export async function updateTransaction(
  transactionId: string,
  formData: FormData,
) {
  const idParsed = transactionIdSchema.safeParse(transactionId);
  if (!idParsed.success) {
    return { error: idParsed.error.issues[0]?.message || "유효하지 않은 거래 ID입니다." };
  }

  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  const { data: oldTx, error: fetchError } = await supabase
    .from("transactions")
    .select("household_id, transaction_date, recurring_rule_id, is_recurring, type, amount, memo, user_id")
    .eq("id", transactionId)
    .maybeSingle();

  if (fetchError) {
    return { error: getKoreanErrorMessage(fetchError) };
  }

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
    update_recurring_rule: formData.get("update_recurring_rule") === "true",
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

    const txDate = parseTransactionDate(transactionDate);
    const targetDay = txDate.day;
    const { error: updateError } = await supabase.rpc(
      "update_transaction_recurring_state",
      updateRecurringTransactionRpcArgs(
        transactionId,
        {
          householdId,
          userId: user.id,
          type,
          amount,
          categoryId,
          transactionDate,
          expenseType,
          memo,
          targetDay,
          endDate: parsed.data.recurring_end_date ?? null,
        },
        parsed.data.recurring_enabled,
        parsed.data.update_recurring_rule,
      ),
    );

    if (updateError) throw updateError;

    const recurringLogNote = parsed.data.recurring_enabled
      ? oldTx.recurring_rule_id
        ? parsed.data.update_recurring_rule
          ? " (반복 규칙 동기화)"
          : ""
        : " (반복 거래 연동 등록)"
      : oldTx.recurring_rule_id
        ? " (반복 거래 연동 해제)"
        : "";

    if (oldTx.transaction_date !== transactionDate) {
      const oldDate = parseTransactionDate(oldTx.transaction_date);
      await syncMonthlyBalance(
        supabase,
        householdId,
        oldDate.year,
        oldDate.month,
      );
    }

    await syncMonthlyBalance(
      supabase,
      householdId,
      txDate.year,
      txDate.month,
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
