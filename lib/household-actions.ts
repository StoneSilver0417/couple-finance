"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getKoreanErrorMessage } from "@/lib/error-messages";

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
    // SECURITY DEFINER 함수로 가구 생성 (RLS 우회)
    const { data: householdId, error: rpcError } = await supabase.rpc(
      "create_household_with_owner",
      {
        p_user_id: user.id,
        p_user_email: user.email!,
        p_user_name: userName,
        p_household_name: householdName,
        p_invite_code: generateInviteCode(),
      },
    );

    if (rpcError) throw rpcError;

    if (!householdId) {
      throw new Error("가구 생성에 실패했습니다.");
    }
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
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
    // SECURITY DEFINER 함수로 가구 참여 (RLS 우회)
    const { data: result, error: rpcError } = await supabase.rpc(
      "join_household_as_member",
      {
        p_user_id: user.id,
        p_user_email: user.email!,
        p_user_name: userName,
        p_invite_code: inviteCode,
      },
    );

    if (rpcError) throw rpcError;

    // RPC 함수에서 반환된 에러 확인
    if (result?.error) {
      return { error: result.error };
    }
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
