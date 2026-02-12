"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getKoreanErrorMessage } from "@/lib/error-messages";
import { createActivityLog } from "./activity-log-actions";

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
      is_hidden: false,
      display_order: 999, // Put custom categories at the end
    });

    if (error) throw error;

    await createActivityLog("CREATE", "CATEGORY", `카테고리 "${name}" 추가`);

    revalidatePath("/settings/categories");
    revalidatePath("/transactions/new");
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("household_id")
      .eq("id", user.id)
      .single();

    if (!profile?.household_id) {
      return { error: "가구 정보가 없습니다." };
    }

    const { error } = await supabase
      .from("categories")
      .update({
        name,
        icon,
        color,
      })
      .eq("id", categoryId)
      .eq("household_id", profile.household_id);

    if (error) throw error;

    await createActivityLog("UPDATE", "CATEGORY", `카테고리 "${name}" 수정`);

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
    // 1. 유저의 가구 ID 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("household_id")
      .eq("id", user.id)
      .single();

    if (!profile?.household_id) {
      return { error: "가구 정보가 없습니다." };
    }

    // 2. 삭제 전 이름 조회 및 소유권 확인
    const { data: cat } = await supabase
      .from("categories")
      .select("name, household_id")
      .eq("id", categoryId)
      .single();

    if (!cat) {
      return { error: "카테고리를 찾을 수 없습니다." };
    }

    if (cat.household_id !== profile.household_id) {
      return { error: "카테고리 삭제 권한이 없습니다." };
    }

    // 3. 소프트 삭제: is_hidden = true
    const { error } = await supabase
      .from("categories")
      .update({ is_hidden: true })
      .eq("id", categoryId)
      .eq("household_id", profile.household_id);

    if (error) throw error;

    if (cat) {
      await createActivityLog(
        "DELETE",
        "CATEGORY",
        `카테고리 "${cat.name}" 삭제`,
      );
    }

    revalidatePath("/settings/categories");
    revalidatePath("/transactions/new");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function restoreCategory(categoryId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("household_id")
      .eq("id", user.id)
      .single();

    if (!profile?.household_id) {
      return { error: "가구 정보가 없습니다." };
    }

    const { data: cat } = await supabase
      .from("categories")
      .select("name, household_id")
      .eq("id", categoryId)
      .single();

    if (!cat || cat.household_id !== profile.household_id) {
      return { error: "카테고리 복원 권한이 없습니다." };
    }

    const { error } = await supabase
      .from("categories")
      .update({ is_hidden: false })
      .eq("id", categoryId)
      .eq("household_id", profile.household_id);

    if (error) throw error;

    if (cat) {
      await createActivityLog(
        "UPDATE",
        "CATEGORY",
        `카테고리 "${cat.name}" 복원`,
      );
    }

    revalidatePath("/settings/categories");
    revalidatePath("/transactions/new");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}
