"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { seedDefaultPaymentMethods } from "./payment-method-actions";

// Generate a random 8-character invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function createHousehold(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const householdName = formData.get("household_name") as string;
  const userName = formData.get("user_name") as string;

  if (!householdName || !userName) {
    return { error: "모든 항목을 입력해주세요." };
  }

  try {
    // Create household
    const { data: household, error: householdError } = await supabase
      .from("households")
      .insert({
        name: householdName,
        invite_code: generateInviteCode(),
      })
      .select()
      .single();

    if (householdError) throw householdError;

    // Create or update profile (OWNER 역할)
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email!,
      full_name: userName,
      household_id: household.id,
      role: "OWNER",
    });

    if (profileError) throw profileError;

    // Seed default categories
    const { error: seedError } = await supabase.rpc(
      "create_default_categories",
      {
        p_household_id: household.id,
      },
    );

    if (seedError) {
      console.error("Category seed error:", seedError);
    }

    // Seed default payment methods
    await seedDefaultPaymentMethods(household.id);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "가구 생성에 실패했습니다.";
    return { error: message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function joinHousehold(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const inviteCode = (formData.get("invite_code") as string).toUpperCase();
  const userName = formData.get("user_name") as string;

  if (!inviteCode || !userName) {
    return { error: "모든 항목을 입력해주세요." };
  }

  try {
    // Find household by invite code
    const { data: household, error: householdError } = await supabase
      .from("households")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();

    if (householdError || !household) {
      return { error: "유효하지 않은 초대 코드입니다." };
    }

    // Check if household already has 2 members
    const { data: members, error: membersError } = await supabase
      .from("profiles")
      .select("id")
      .eq("household_id", household.id);

    if (membersError) throw membersError;

    if (members && members.length >= 2) {
      return { error: "이미 2명의 구성원이 있는 가구입니다." };
    }

    // Create or update profile (MEMBER 역할)
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email!,
      full_name: userName,
      household_id: household.id,
      role: "MEMBER",
    });

    if (profileError) throw profileError;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "가구 참여에 실패했습니다.";
    return { error: message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
