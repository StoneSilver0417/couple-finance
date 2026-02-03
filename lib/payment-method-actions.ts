"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { PaymentMethodType } from "@/types";
import { getKoreanErrorMessage } from "@/lib/error-messages";

export async function getPaymentMethods() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다.", data: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    return { error: "가구 정보가 없습니다.", data: null };
  }

  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("household_id", profile.household_id)
    .order("display_order", { ascending: true });

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data };
}

export async function createPaymentMethod(formData: FormData) {
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
  const type = formData.get("type") as PaymentMethodType;
  const icon = formData.get("icon") as string | null;
  const color = formData.get("color") as string | null;
  const isDefault = formData.get("is_default") === "true";

  if (!name || !type) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  try {
    // 기본 결제 수단으로 설정 시 기존 기본값 해제
    if (isDefault) {
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("household_id", profile.household_id)
        .eq("is_default", true);
    }

    // 표시 순서 계산
    const { count } = await supabase
      .from("payment_methods")
      .select("*", { count: "exact", head: true })
      .eq("household_id", profile.household_id);

    const { error } = await supabase.from("payment_methods").insert({
      household_id: profile.household_id,
      name,
      type,
      icon,
      color,
      is_default: isDefault,
      display_order: (count || 0) + 1,
    });

    if (error) throw error;

    revalidatePath("/settings");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function updatePaymentMethod(id: string, formData: FormData) {
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
  const type = formData.get("type") as PaymentMethodType;
  const icon = formData.get("icon") as string | null;
  const color = formData.get("color") as string | null;
  const isDefault = formData.get("is_default") === "true";

  if (!name || !type) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  try {
    // 기본 결제 수단으로 설정 시 기존 기본값 해제
    if (isDefault) {
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("household_id", profile.household_id)
        .eq("is_default", true);
    }

    const { error } = await supabase
      .from("payment_methods")
      .update({
        name,
        type,
        icon,
        color,
        is_default: isDefault,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/settings");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function deletePaymentMethod(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  try {
    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/settings");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

// 기본 결제 수단 시딩
export async function seedDefaultPaymentMethods(householdId: string) {
  const supabase = await createClient();

  const defaultMethods = [
    { name: "현금", type: "CASH", icon: "💵", is_default: true, display_order: 1 },
    { name: "체크카드", type: "DEBIT_CARD", icon: "💳", is_default: false, display_order: 2 },
    { name: "신용카드", type: "CREDIT_CARD", icon: "💳", is_default: false, display_order: 3 },
    { name: "계좌이체", type: "BANK_TRANSFER", icon: "🏦", is_default: false, display_order: 4 },
  ];

  try {
    const { error } = await supabase.from("payment_methods").insert(
      defaultMethods.map((method) => ({
        ...method,
        household_id: householdId,
      }))
    );

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}
