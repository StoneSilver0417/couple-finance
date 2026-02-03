"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getKoreanErrorMessage } from "@/lib/error-messages";

export async function createCategory(formData: FormData) {
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

  const name = formData.get("name") as string;
  const type = formData.get("type") as "income" | "expense";
  const expenseCategory =
    type === "expense" ? (formData.get("expense_category") as string) : null;
  const icon = formData.get("icon") as string;
  const color = formData.get("color") as string;

  if (!name || !icon || !color) {
    return { error: "모든 항목을 입력해주세요." };
  }

  try {
    const { error } = await supabase.from("categories").insert({
      household_id: profile.household_id,
      name,
      type,
      expense_category: expenseCategory,
      icon,
      color,
      is_custom: true,
      display_order: 999, // Put custom categories at the end
    });

    if (error) throw error;

    revalidatePath("/settings/categories");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const name = formData.get("name") as string;
  const icon = formData.get("icon") as string;
  const color = formData.get("color") as string;

  if (!name || !icon || !color) {
    return { error: "모든 항목을 입력해주세요." };
  }

  try {
    const { error } = await supabase
      .from("categories")
      .update({
        name,
        icon,
        color,
      })
      .eq("id", categoryId);

    if (error) throw error;

    revalidatePath("/settings/categories");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  try {
    // Check if category is used in transactions
    const { data: transactions } = await supabase
      .from("transactions")
      .select("id")
      .eq("category_id", categoryId)
      .limit(1);

    if (transactions && transactions.length > 0) {
      return {
        error: "이 카테고리는 거래 내역에서 사용 중이어서 삭제할 수 없습니다.",
      };
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId)
      .eq("is_custom", true); // Only allow deleting custom categories

    if (error) throw error;

    revalidatePath("/settings/categories");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function toggleCategoryVisibility(
  categoryId: string,
  isHidden: boolean,
) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("categories")
      .update({ is_hidden: isHidden })
      .eq("id", categoryId);

    if (error) throw error;

    revalidatePath("/settings/categories");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}
