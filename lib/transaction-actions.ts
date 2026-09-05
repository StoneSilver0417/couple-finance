"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function createTransaction(formData: FormData) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  // Zod 스키마 사전 검증
  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    amount: Number(formData.get("amount")),
    category_id: formData.get("category_id"),
    transaction_date: formData.get("transaction_date"),
    memo: formData.get("memo") || undefined,
    expense_type: formData.get("expense_type") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "입력값이 유효하지 않습니다." };
  }

  // 외부 입력 검증: 금액(양수/상한), 거래 유형, 날짜 형식
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

    // RPC 함수로 INSERT (RLS 우회)
    const { error } = await supabase.rpc("create_transaction", {
      p_household_id: householdId,
      p_user_id: user.id,
      p_type: type,
      p_amount: amount,
      p_category_id: categoryId,
      p_transaction_date: transactionDate,
      p_expense_type: expenseType,
      p_memo: memo,
    });

    if (error) throw error;

    // 월별 잔액 동기화
    const date = new Date(transactionDate);
    await syncMonthlyBalance(
      supabase,
      householdId,
      date.getFullYear(),
      date.getMonth() + 1,
    );

    // 활동 기록
    const typeLabel = type === "income" ? "수입" : "지출";
    const amountStr = Math.round(amount).toLocaleString("ko-KR");
    await logActivity(
      supabase,
      householdId,
      user.id,
      "CREATE",
      "TRANSACTION",
      `${typeLabel} ₩${amountStr} 추가${memo ? ` - ${memo}` : ""}`,
    );
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }

  revalidatePath("/", "layout");
  redirect("/transactions");
}

export async function deleteTransaction(transactionId: string) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  try {
    // 삭제 전 거래 정보 조회 (잔액 동기화 및 소유권 확인용)
    const { data: tx } = await supabase
      .from("transactions")
      .select("household_id, transaction_date, type, amount, memo")
      .eq("id", transactionId)
      .single();

    // 소유권 확인 (IDOR 방지)
    if (!tx || tx.household_id !== householdId) {
      return { error: "거래를 찾을 수 없거나 삭제 권한이 없습니다." };
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId)
      .eq("household_id", householdId);

    if (error) throw error;

    const date = new Date(tx.transaction_date);
    await syncMonthlyBalance(
      supabase,
      householdId,
      date.getFullYear(),
      date.getMonth() + 1,
    );
    const typeLabel = tx.type === "income" ? "수입" : "지출";
    const amountStr = Math.round(Number(tx.amount)).toLocaleString("ko-KR");
    await logActivity(
      supabase,
      householdId,
      user.id,
      "DELETE",
      "TRANSACTION",
      `${typeLabel} ₩${amountStr} 삭제${tx.memo ? ` - ${tx.memo}` : ""}`,
    );

    revalidatePath("/transactions");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}
