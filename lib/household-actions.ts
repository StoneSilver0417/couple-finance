"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getKoreanErrorMessage } from "@/lib/error-messages";
import { getTrimmedString } from "@/lib/validation";

import crypto from "crypto";

// Generate a random 8-character invite code (cryptographically secure)
function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export async function createHousehold(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const householdName = getTrimmedString(formData.get("household_name"), 50);
  const userName = getTrimmedString(formData.get("user_name"), 50);

  if (!householdName || !userName) {
    return { error: "모든 항목을 입력해주세요. (각 50자 이내)" };
  }

  const inviteCode = generateInviteCode();

  try {
    // 먼저 RPC 함수 시도
    const { data: householdId, error: rpcError } = await supabase.rpc(
      "create_household_with_owner",
      {
        p_user_email: user.email!,
        p_user_name: userName,
        p_household_name: householdName,
        p_invite_code: inviteCode,
      },
    );

    if (rpcError) {
      console.error("[createHousehold] RPC 에러:", rpcError.message);

      // RPC 함수가 없으면 직접 INSERT 시도 (폴백)
      if (
        rpcError.message?.includes("could not find") ||
        rpcError.code === "PGRST202"
      ) {
        console.log("[createHousehold] RPC 함수 없음, 직접 INSERT 시도");
        return await createHouseholdDirect(
          supabase,
          user,
          householdName,
          userName,
          inviteCode,
        );
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
    const { error: categoryError } = await supabase.rpc(
      "create_default_categories",
      {
        p_household_id: household.id,
      },
    );

    if (categoryError) {
      console.error(
        "[createHouseholdDirect] RPC 카테고리 생성 실패, 직접 INSERT 시도:",
        categoryError.message,
      );
      // RPC 함수가 없으면 직접 INSERT
      await insertDefaultCategories(supabase, household.id);
    }

    // 4. 기본 결제 수단 생성
    const { error: paymentError } = await supabase.rpc(
      "create_default_payment_methods",
      {
        p_household_id: household.id,
      },
    );

    if (paymentError) {
      console.error(
        "[createHouseholdDirect] 결제수단 생성 실패:",
        paymentError,
      );
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

  // null/비문자열 입력으로 .toUpperCase() 크래시가 나지 않도록 안전하게 추출
  const rawInviteCode = getTrimmedString(formData.get("invite_code"), 16);
  const userName = getTrimmedString(formData.get("user_name"), 50);

  if (!rawInviteCode || !userName) {
    return { error: "모든 항목을 입력해주세요." };
  }

  const inviteCode = rawInviteCode.toUpperCase();

  try {
    // 먼저 RPC 함수 시도
    const { data: result, error: rpcError } = await supabase.rpc(
      "join_household_as_member",
      {
        p_user_email: user.email!,
        p_user_name: userName,
        p_invite_code: inviteCode,
      },
    );

    if (rpcError) {
      console.error("[joinHousehold] RPC 에러:", rpcError.message);

      // RPC 함수가 없으면 직접 처리 (폴백)
      if (
        rpcError.message?.includes("could not find") ||
        rpcError.code === "PGRST202"
      ) {
        console.log("[joinHousehold] RPC 함수 없음, 직접 처리 시도");
        return await joinHouseholdDirect(supabase, user, userName, inviteCode);
      }
      throw rpcError;
    }

    // RPC 함수에서 반환된 에러 확인
    if (result?.error) {
      return { error: getKoreanErrorMessage(result.error) };
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

// 기본 카테고리 직접 INSERT 함수
async function insertDefaultCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
) {
  const defaultCategories = [
    // 수입 카테고리
    {
      name: "월급",
      type: "income",
      expense_category: null,
      color: "#10B981",
      icon: "💰",
      display_order: 1,
    },
    {
      name: "상여",
      type: "income",
      expense_category: null,
      color: "#10B981",
      icon: "🎁",
      display_order: 2,
    },
    {
      name: "수당",
      type: "income",
      expense_category: null,
      color: "#10B981",
      icon: "💵",
      display_order: 3,
    },
    {
      name: "기타 수입",
      type: "income",
      expense_category: null,
      color: "#10B981",
      icon: "💸",
      display_order: 4,
    },
    // 고정 지출
    {
      name: "대출상환",
      type: "expense",
      expense_category: "fixed",
      color: "#EF4444",
      icon: "🏦",
      display_order: 1,
    },
    {
      name: "임차료",
      type: "expense",
      expense_category: "fixed",
      color: "#EF4444",
      icon: "🏠",
      display_order: 2,
    },
    {
      name: "아파트관리비",
      type: "expense",
      expense_category: "fixed",
      color: "#EF4444",
      icon: "🏢",
      display_order: 3,
    },
    {
      name: "공과금",
      type: "expense",
      expense_category: "fixed",
      color: "#EF4444",
      icon: "💡",
      display_order: 4,
    },
    {
      name: "통신비",
      type: "expense",
      expense_category: "fixed",
      color: "#EF4444",
      icon: "📱",
      display_order: 5,
    },
    {
      name: "교육비",
      type: "expense",
      expense_category: "fixed",
      color: "#EF4444",
      icon: "📚",
      display_order: 6,
    },
    {
      name: "보험료",
      type: "expense",
      expense_category: "fixed",
      color: "#EF4444",
      icon: "🛡️",
      display_order: 7,
    },
    // 변동 지출
    {
      name: "식비",
      type: "expense",
      expense_category: "variable",
      color: "#F59E0B",
      icon: "🍚",
      display_order: 1,
    },
    {
      name: "외식비",
      type: "expense",
      expense_category: "variable",
      color: "#F59E0B",
      icon: "🍔",
      display_order: 2,
    },
    {
      name: "생필품",
      type: "expense",
      expense_category: "variable",
      color: "#F59E0B",
      icon: "🧴",
      display_order: 3,
    },
    {
      name: "건강/의료",
      type: "expense",
      expense_category: "variable",
      color: "#F59E0B",
      icon: "💊",
      display_order: 4,
    },
    {
      name: "아기",
      type: "expense",
      expense_category: "variable",
      color: "#F59E0B",
      icon: "👶",
      display_order: 5,
    },
    {
      name: "교통비",
      type: "expense",
      expense_category: "variable",
      color: "#F59E0B",
      icon: "🚗",
      display_order: 6,
    },
    {
      name: "문화/여가",
      type: "expense",
      expense_category: "variable",
      color: "#F59E0B",
      icon: "🎬",
      display_order: 7,
    },
    {
      name: "쇼핑",
      type: "expense",
      expense_category: "variable",
      color: "#F59E0B",
      icon: "🛍️",
      display_order: 8,
    },
    // 비정기 지출
    {
      name: "경조사비",
      type: "expense",
      expense_category: "irregular",
      color: "#8B5CF6",
      icon: "💐",
      display_order: 1,
    },
    {
      name: "세금",
      type: "expense",
      expense_category: "irregular",
      color: "#8B5CF6",
      icon: "📋",
      display_order: 2,
    },
    {
      name: "자동차",
      type: "expense",
      expense_category: "irregular",
      color: "#8B5CF6",
      icon: "🚙",
      display_order: 3,
    },
    {
      name: "대형구매",
      type: "expense",
      expense_category: "irregular",
      color: "#8B5CF6",
      icon: "📦",
      display_order: 4,
    },
    {
      name: "기타",
      type: "expense",
      expense_category: "irregular",
      color: "#8B5CF6",
      icon: "📝",
      display_order: 5,
    },
  ];

  const categoriesWithHousehold = defaultCategories.map((cat) => ({
    ...cat,
    household_id: householdId,
    is_custom: false,
    is_hidden: false,
  }));

  const { error } = await supabase
    .from("categories")
    .insert(categoriesWithHousehold);

  if (error) {
    console.error(
      "[insertDefaultCategories] 카테고리 INSERT 실패:",
      error.message,
    );
  } else {
    console.log("[insertDefaultCategories] 기본 카테고리 생성 완료");
  }
}

// 카테고리가 없는 가구에 기본 카테고리 생성 (외부에서 호출 가능)
export async function ensureDefaultCategories() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) return { error: "가구 정보가 없습니다." };

  // 기존 카테고리 수 확인
  const { count } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("household_id", profile.household_id);

  if (count === 0) {
    await insertDefaultCategories(supabase, profile.household_id);
    revalidatePath("/transactions/new");
    return { created: true };
  }

  return { created: false };
}
