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

  const inviteCode = generateInviteCode();

  try {
    // 먼저 RPC 함수 시도
    const { data: householdId, error: rpcError } = await supabase.rpc(
      "create_household_with_owner",
      {
        p_user_id: user.id,
        p_user_email: user.email!,
        p_user_name: userName,
        p_household_name: householdName,
        p_invite_code: inviteCode,
      },
    );

    if (rpcError) {
      console.error("[createHousehold] RPC 에러:", rpcError.message);

      // RPC 함수가 없으면 직접 INSERT 시도 (폴백)
      if (rpcError.message?.includes("could not find") || rpcError.code === "PGRST202") {
        console.log("[createHousehold] RPC 함수 없음, 직접 INSERT 시도");
        return await createHouseholdDirect(supabase, user, householdName, userName, inviteCode);
      }
      throw rpcError;
    }

    if (!householdId) {
      throw new Error("가구 생성에 실패했습니다.");
    }

    console.log("[createHousehold] 성공:", householdId);
  } catch (error: unknown) {
    console.error("[createHousehold] 에러:", error);
    return { error: getKoreanErrorMessage(error) };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

// RPC 함수 없을 때 직접 INSERT 하는 폴백 함수
async function createHouseholdDirect(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string },
  householdName: string,
  userName: string,
  inviteCode: string,
) {
  try {
    // 1. 가구 생성
    const { data: household, error: householdError } = await supabase
      .from("households")
      .insert({
        name: householdName,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (householdError) {
      console.error("[createHouseholdDirect] 가구 생성 실패:", householdError);
      throw householdError;
    }

    // 2. 프로필 생성/업데이트
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email!,
      full_name: userName,
      household_id: household.id,
      role: "OWNER",
    });

    if (profileError) {
      console.error("[createHouseholdDirect] 프로필 생성 실패:", profileError);
      throw profileError;
    }

    // 3. 기본 카테고리 생성
    const { error: categoryError } = await supabase.rpc("create_default_categories", {
      p_household_id: household.id,
    });

    if (categoryError) {
      console.error("[createHouseholdDirect] 카테고리 생성 실패:", categoryError);
    }

    // 4. 기본 결제 수단 생성
    const { error: paymentError } = await supabase.rpc("create_default_payment_methods", {
      p_household_id: household.id,
    });

    if (paymentError) {
      console.error("[createHouseholdDirect] 결제수단 생성 실패:", paymentError);
    }

    console.log("[createHouseholdDirect] 성공:", household.id);
  } catch (error: unknown) {
    console.error("[createHouseholdDirect] 최종 에러:", error);
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
    // 먼저 RPC 함수 시도
    const { data: result, error: rpcError } = await supabase.rpc(
      "join_household_as_member",
      {
        p_user_id: user.id,
        p_user_email: user.email!,
        p_user_name: userName,
        p_invite_code: inviteCode,
      },
    );

    if (rpcError) {
      console.error("[joinHousehold] RPC 에러:", rpcError.message);

      // RPC 함수가 없으면 직접 처리 (폴백)
      if (rpcError.message?.includes("could not find") || rpcError.code === "PGRST202") {
        console.log("[joinHousehold] RPC 함수 없음, 직접 처리 시도");
        return await joinHouseholdDirect(supabase, user, userName, inviteCode);
      }
      throw rpcError;
    }

    // RPC 함수에서 반환된 에러 확인
    if (result?.error) {
      return { error: result.error };
    }

    console.log("[joinHousehold] 성공");
  } catch (error: unknown) {
    console.error("[joinHousehold] 에러:", error);
    return { error: getKoreanErrorMessage(error) };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

// RPC 함수 없을 때 직접 처리하는 폴백 함수
async function joinHouseholdDirect(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string },
  userName: string,
  inviteCode: string,
) {
  try {
    // 1. 초대 코드로 가구 찾기
    const { data: household, error: householdError } = await supabase
      .from("households")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();

    if (householdError || !household) {
      return { error: "유효하지 않은 초대 코드입니다." };
    }

    // 2. 멤버 수 확인
    const { data: members, error: membersError } = await supabase
      .from("profiles")
      .select("id")
      .eq("household_id", household.id);

    if (membersError) throw membersError;

    if (members && members.length >= 2) {
      return { error: "이미 2명의 구성원이 있는 가구입니다." };
    }

    // 3. 프로필 생성/업데이트
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email!,
      full_name: userName,
      household_id: household.id,
      role: "MEMBER",
    });

    if (profileError) {
      console.error("[joinHouseholdDirect] 프로필 생성 실패:", profileError);
      throw profileError;
    }

    console.log("[joinHouseholdDirect] 성공");
  } catch (error: unknown) {
    console.error("[joinHouseholdDirect] 최종 에러:", error);
    return { error: getKoreanErrorMessage(error) };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
