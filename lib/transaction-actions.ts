"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { syncMonthlyBalance } from "./balance-actions";
import { createActivityLog } from "./activity-log-actions";
import { getKoreanErrorMessage } from "@/lib/error-messages";

export async function createTransaction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    return { error: "가구 정보가 없습니다." };
  }

  const type = formData.get("type") as "income" | "expense";
  const amount = parseFloat(formData.get("amount") as string);
  const categoryId = formData.get("category_id") as string;
  const transactionDate = formData.get("transaction_date") as string;
  const memo = (formData.get("memo") as string) || null;
  const expenseType =
    type === "expense" ? (formData.get("expense_type") as string) : null;

  if (!amount || !categoryId || !transactionDate) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  try {
    // RPC 함수로 INSERT (RLS 우회)
    const { data: transactionId, error } = await supabase.rpc("create_transaction", {
      p_household_id: profile.household_id,
      p_user_id: user.id,
      p_type: type,
      p_amount: amount,
      p_category_id: categoryId,
      p_transaction_date: transactionDate,
      p_expense_type: expenseType,
      p_memo: memo,
    });

    if (error) throw error;

    // Sync monthly balance
    const date = new Date(transactionDate);
    await syncMonthlyBalance(
      profile.household_id,
      date.getFullYear(),
      date.getMonth() + 1,
    );

    // Log activity
    const typeLabel = type === "income" ? "수입" : "지출";
    const amountStr = amount.toLocaleString();
    await createActivityLog(
      "CREATE",
      "TRANSACTION",
      `${typeLabel} ₩${amountStr} 추가${memo ? ` - ${memo}` : ""}`
    );
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }

  revalidatePath("/", "layout");
  redirect("/transactions");
}

export async function deleteTransaction(transactionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  try {
    // Get transaction details before deletion to sync balance later
    const { data: tx } = await supabase
      .from("transactions")
      .select("household_id, transaction_date, type, amount, memo")
      .eq("id", transactionId)
      .single();

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId);

    if (error) throw error;

    // Sync monthly balance if tx existed
    if (tx) {
      const date = new Date(tx.transaction_date);
      await syncMonthlyBalance(
        tx.household_id,
        date.getFullYear(),
        date.getMonth() + 1,
      );

      // Log activity
      const typeLabel = tx.type === "income" ? "수입" : "지출";
      const amountStr = Number(tx.amount).toLocaleString();
      await createActivityLog(
        "DELETE",
        "TRANSACTION",
        `${typeLabel} ₩${amountStr} 삭제${tx.memo ? ` - ${tx.memo}` : ""}`
      );
    }

    revalidatePath("/transactions");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}
