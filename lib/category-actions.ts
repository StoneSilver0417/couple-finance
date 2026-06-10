"use server";

import { revalidatePath } from "next/cache";
import { getHouseholdContext } from "@/lib/supabase/household-context";
import { getKoreanErrorMessage } from "@/lib/error-messages";
import { logActivity } from "./activity-log";
import {
  getTrimmedString,
  isExpenseType,
  isTransactionType,
} from "@/lib/validation";

export async function createCategory(formData: FormData) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  const name = getTrimmedString(formData.get("name"), 50);
  const type = formData.get("type");
  const icon = getTrimmedString(formData.get("icon"), 16);
  const color = getTrimmedString(formData.get("color"), 16);

  if (!isTransactionType(type)) {
    return { error: "카테고리 유형이 올바르지 않습니다." };
  }
  if (!name || !icon || !color) {
    return { error: "모든 항목을 입력해주세요." };
  }

  const rawExpenseCategory = formData.get("expense_category");
  const expenseCategory =
    type === "expense" && isExpenseType(rawExpenseCategory)
      ? rawExpenseCategory
      : null;

  try {
    const { error } = await supabase.from("categories").insert({
      household_id: householdId,
      name,
      type,
      expense_category: expenseCategory,
      icon,
      color,
      is_custom: true,
      is_hidden: false,
      display_order: 999, // 커스텀 카테고리는 목록 맨 뒤로
    });

    if (error) throw error;

    await logActivity(
      supabase,
      householdId,
      user.id,
      "CREATE",
      "CATEGORY",
      `카테고리 "${name}" 추가`,
    );

    revalidatePath("/settings/categories");
    revalidatePath("/transactions/new");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  const name = getTrimmedString(formData.get("name"), 50);
  const icon = getTrimmedString(formData.get("icon"), 16);
  const color = getTrimmedString(formData.get("color"), 16);

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
      .eq("id", categoryId)
      .eq("household_id", householdId);

    if (error) throw error;

    await logActivity(
      supabase,
      householdId,
      user.id,
      "UPDATE",
      "CATEGORY",
      `카테고리 "${name}" 수정`,
    );

    revalidatePath("/settings/categories");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function deleteCategory(categoryId: string) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  try {
    // 삭제 전 이름 조회 및 소유권 확인 (IDOR 방지)
    const { data: cat } = await supabase
      .from("categories")
      .select("name, household_id")
      .eq("id", categoryId)
      .single();

    if (!cat || cat.household_id !== householdId) {
      return { error: "카테고리를 찾을 수 없거나 삭제 권한이 없습니다." };
    }

    // 소프트 삭제: is_hidden = true
    const { error } = await supabase
      .from("categories")
      .update({ is_hidden: true })
      .eq("id", categoryId)
      .eq("household_id", householdId);

    if (error) throw error;

    await logActivity(
      supabase,
      householdId,
      user.id,
      "DELETE",
      "CATEGORY",
      `카테고리 "${cat.name}" 삭제`,
    );

    revalidatePath("/settings/categories");
    revalidatePath("/transactions/new");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function restoreCategory(categoryId: string) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  try {
    const { data: cat } = await supabase
      .from("categories")
      .select("name, household_id")
      .eq("id", categoryId)
      .single();

    if (!cat || cat.household_id !== householdId) {
      return { error: "카테고리 복원 권한이 없습니다." };
    }

    const { error } = await supabase
      .from("categories")
      .update({ is_hidden: false })
      .eq("id", categoryId)
      .eq("household_id", householdId);

    if (error) throw error;

    await logActivity(
      supabase,
      householdId,
      user.id,
      "UPDATE",
      "CATEGORY",
      `카테고리 "${cat.name}" 복원`,
    );

    revalidatePath("/settings/categories");
    revalidatePath("/transactions/new");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}
