"use server";

import { revalidatePath } from "next/cache";
import { getHouseholdContext } from "@/lib/supabase/household-context";
import { syncMonthlyBalance } from "./balance-actions";
import { logActivity } from "./activity-log";
import { getKoreanErrorMessage } from "@/lib/error-messages";
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

  // 1. 소유권 확인 + 잔액 동기화용 기존 데이터 조회 (IDOR 방지)
  const { data: oldTx } = await supabase
    .from("transactions")
    .select("household_id, transaction_date")
    .eq("id", transactionId)
    .single();

  if (!oldTx || oldTx.household_id !== householdId) {
    return { error: "거래 정보를 찾을 수 없거나 수정 권한이 없습니다." };
  }

  // 2. 외부 입력 검증
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
    // 3. 거래 수정
    const { error } = await supabase
      .from("transactions")
      .update({
        type,
        expense_type: expenseType,
        amount,
        category_id: categoryId,
        transaction_date: transactionDate,
        memo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId)
      .eq("household_id", householdId); // 이중 안전장치

    if (error) throw error;

    // 4. 잔액 동기화 (날짜가 바뀌었으면 기존 월도 함께)
    if (oldTx.transaction_date !== transactionDate) {
      const oldDate = new Date(oldTx.transaction_date);
      await syncMonthlyBalance(
        supabase,
        householdId,
        oldDate.getFullYear(),
        oldDate.getMonth() + 1,
      );
    }

    const newDate = new Date(transactionDate);
    await syncMonthlyBalance(
      supabase,
      householdId,
      newDate.getFullYear(),
      newDate.getMonth() + 1,
    );

    // 활동 기록
    const typeLabel = type === "income" ? "수입" : "지출";
    const amountStr = Math.round(amount).toLocaleString("ko-KR");
    await logActivity(
      supabase,
      householdId,
      user.id,
      "UPDATE",
      "TRANSACTION",
      `${typeLabel} ₩${amountStr} 수정${memo ? ` - ${memo}` : ""}`,
    );

    revalidatePath("/transactions");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}
