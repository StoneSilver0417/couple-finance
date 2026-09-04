"use server";

import { revalidatePath } from "next/cache";
import {
  getHouseholdContext,
  type ServerSupabaseClient,
} from "@/lib/supabase/household-context";
import { logActivity } from "./activity-log";
import { getKoreanErrorMessage } from "@/lib/error-messages";
import {
  getTrimmedString,
  isAssetOwnerType,
  parseNonNegativeAmount,
} from "@/lib/validation";

// 자산 스냅샷 저장 (자산 변경 시 내부 호출 — 공개 액션 아님)
async function saveAssetSnapshot(
  supabase: ServerSupabaseClient,
  householdId: string,
) {
  try {
    // 순자산 계산
    const { data: assets } = await supabase
      .from("assets")
      .select("current_amount, is_liability, owner_type, owner_profile_id")
      .eq("household_id", householdId);

    if (!assets) return;

    let totalNetWorth = 0;
    const breakdown: Record<string, number> = {};

    assets.forEach((asset) => {
      const amount = asset.is_liability
        ? -Number(asset.current_amount)
        : Number(asset.current_amount);
      totalNetWorth += amount;

      // 소유권별 집계
      const key =
        asset.owner_type === "INDIVIDUAL"
          ? asset.owner_profile_id || "JOINT"
          : asset.owner_type;

      breakdown[key] = (breakdown[key] || 0) + amount;
    });

    const today = new Date().toISOString().split("T")[0];

    // UPSERT
    await supabase.from("asset_history").upsert(
      {
        household_id: householdId,
        record_date: today,
        total_net_worth: totalNetWorth,
        breakdown_data: breakdown,
      },
      { onConflict: "household_id,record_date" },
    );
  } catch (error) {
    console.error("자산 스냅샷 저장 실패:", error);
  }
}

// FormData에서 자산 입력값을 검증해 추출 (생성/수정 공통)
function parseAssetForm(formData: FormData) {
  const name = getTrimmedString(formData.get("name"), 100);
  const type = getTrimmedString(formData.get("type"), 50);
  const currentAmount = parseNonNegativeAmount(formData.get("current_amount"));
  const isLiability = formData.get("is_liability") === "true";
  const rawOwnerType = formData.get("owner_type") || "JOINT";
  const ownerType = isAssetOwnerType(rawOwnerType) ? rawOwnerType : null;
  const ownerProfileId = getTrimmedString(formData.get("owner_profile_id"), 64);
  const childName = getTrimmedString(formData.get("child_name"), 50);

  if (!name || !type || currentAmount === null) {
    return { error: "필수 항목을 모두 입력해주세요." as const };
  }
  if (!ownerType) {
    return { error: "소유 구분이 올바르지 않습니다." as const };
  }

  return {
    error: null,
    values: {
      name,
      type,
      current_amount: currentAmount,
      is_liability: isLiability,
      owner_type: ownerType,
      owner_profile_id: ownerType === "INDIVIDUAL" ? ownerProfileId : null,
      child_name: ownerType === "CHILD" ? childName : null,
    },
  };
}

export async function createAsset(formData: FormData) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  const parsed = parseAssetForm(formData);
  if (parsed.error !== null) return { error: parsed.error };
  const { values } = parsed;

  try {
    const { error } = await supabase.from("assets").insert({
      household_id: householdId,
      ...values,
    });

    if (error) throw error;

    // 활동 기록
    const label = values.is_liability ? "부채" : "자산";
    await logActivity(
      supabase,
      householdId,
      user.id,
      "CREATE",
      "ASSET",
      `${label} "${values.name}" ₩${Math.round(values.current_amount).toLocaleString("ko-KR")} 추가`,
    );

    // 자산 스냅샷 저장
    await saveAssetSnapshot(supabase, householdId);

    revalidatePath("/assets");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function updateAsset(assetId: string, formData: FormData) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  const parsed = parseAssetForm(formData);
  if (parsed.error !== null) return { error: parsed.error };
  const { values } = parsed;

  try {
    const { error } = await supabase
      .from("assets")
      .update({
        ...values,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assetId)
      .eq("household_id", householdId);

    if (error) throw error;

    // 활동 기록
    const label = values.is_liability ? "부채" : "자산";
    await logActivity(
      supabase,
      householdId,
      user.id,
      "UPDATE",
      "ASSET",
      `${label} "${values.name}" ₩${Math.round(values.current_amount).toLocaleString("ko-KR")}으로 수정`,
    );

    // 자산 스냅샷 저장
    await saveAssetSnapshot(supabase, householdId);

    revalidatePath("/assets");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function deleteAsset(assetId: string) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, householdId } = ctx;

  try {
    // 삭제 전 자산 정보 조회 + 소유권 확인 (IDOR 방지)
    const { data: asset } = await supabase
      .from("assets")
      .select("name, current_amount, is_liability, household_id")
      .eq("id", assetId)
      .single();

    if (!asset || asset.household_id !== householdId) {
      return { error: "자산 정보를 찾을 수 없거나 삭제 권한이 없습니다." };
    }

    const { error } = await supabase
      .from("assets")
      .delete()
      .eq("id", assetId)
      .eq("household_id", householdId);

    if (error) throw error;

    // 비동기 작업(로그 및 스냅샷)을 백그라운드로 분리하여 응답 속도 및 안정성 최적화
    (async () => {
      try {
        const label = asset.is_liability ? "부채" : "자산";
        await logActivity(
          supabase,
          householdId,
          user.id,
          "DELETE",
          "ASSET",
          `${label} "${asset.name}" ₩${Math.round(Number(asset.current_amount)).toLocaleString("ko-KR")} 삭제`,
        );
        await saveAssetSnapshot(supabase, householdId);
      } catch (err) {
        console.error("Background asset cleanup error:", err);
      }
    })();

    revalidatePath("/assets");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

// 자산 히스토리 조회 (차트용)
export async function getAssetHistory(months: number = 6) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error, data: null };
  const { supabase, householdId } = ctx;

  // 외부에서 조작 가능한 인자이므로 조회 범위 제한 (1개월 ~ 10년)
  const safeMonths = Math.min(Math.max(Math.trunc(months) || 6, 1), 120);

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - safeMonths);

  const { data, error } = await supabase
    .from("asset_history")
    .select("*")
    .eq("household_id", householdId)
    .gte("record_date", startDate.toISOString().split("T")[0])
    .order("record_date", { ascending: true });

  if (error) {
    return { error: getKoreanErrorMessage(error), data: null };
  }

  return { error: null, data };
}
