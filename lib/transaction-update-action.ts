"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { syncMonthlyBalance } from "./balance-actions";

export async function updateTransaction(
  transactionId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 1. Validate ownership & Get old data for balance sync
  const { data: oldTx, error: fetchError } = await supabase
    .from("transactions")
    .select("household_id, transaction_date")
    .eq("id", transactionId)
    .single();

  if (fetchError || !oldTx) {
    return { error: "거래 정보를 찾을 수 없거나 권한이 없습니다." };
  }

  const householdId = oldTx.household_id;

  // 2. Parse new data
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
    // 3. Update database
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
      .eq("household_id", householdId); // Extra safety

    if (error) throw error;

    // 4. Sync balances
    // Sync for old date
    if (oldTx.transaction_date !== transactionDate) {
      const oldDate = new Date(oldTx.transaction_date);
      await syncMonthlyBalance(
        householdId,
        oldDate.getFullYear(),
        oldDate.getMonth() + 1,
      );
    }

    // Sync for new date
    const newDate = new Date(transactionDate);
    await syncMonthlyBalance(
      householdId,
      newDate.getFullYear(),
      newDate.getMonth() + 1,
    );

    revalidatePath("/transactions");
    // No redirect here, usually edit happens in place or modal
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "거래 수정에 실패했습니다." };
  }
}
