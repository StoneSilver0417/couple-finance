"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createActivityLog } from "./activity-log-actions";
import { getKoreanErrorMessage } from "@/lib/error-messages";

// 자산 스냅샷 저장 (자산 변경 시 호출)
async function saveAssetSnapshot(householdId: string) {
  const supabase = await createClient();

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
      { onConflict: "household_id,record_date" }
    );
  } catch (error) {
    console.error("자산 스냅샷 저장 실패:", error);
  }
}

export async function createAsset(formData: FormData) {
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
  const type = formData.get("type") as string;
  const currentAmount = parseFloat(formData.get("current_amount") as string);
  const isLiability = formData.get("is_liability") === "true";
  const ownerType = (formData.get("owner_type") as string) || "JOINT";
  const ownerProfileId = formData.get("owner_profile_id") as string | null;
  const childName = formData.get("child_name") as string | null;

  if (!name || !type || isNaN(currentAmount)) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  try {
    const { error } = await supabase.from("assets").insert({
      household_id: profile.household_id,
      name,
      type,
      current_amount: currentAmount,
      is_liability: isLiability,
      owner_type: ownerType,
      owner_profile_id: ownerType === "INDIVIDUAL" ? ownerProfileId : null,
      child_name: ownerType === "CHILD" ? childName : null,
    });

    if (error) throw error;

    // Log activity
    const label = isLiability ? "부채" : "자산";
    await createActivityLog(
      "CREATE",
      "ASSET",
      `${label} "${name}" ₩${currentAmount.toLocaleString()} 추가`
    );

    // 자산 스냅샷 저장
    await saveAssetSnapshot(profile.household_id);

    revalidatePath("/assets");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function updateAsset(assetId: string, formData: FormData) {
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
  const type = formData.get("type") as string;
  const currentAmount = parseFloat(formData.get("current_amount") as string);
  const isLiability = formData.get("is_liability") === "true";
  const ownerType = (formData.get("owner_type") as string) || "JOINT";
  const ownerProfileId = formData.get("owner_profile_id") as string | null;
  const childName = formData.get("child_name") as string | null;

  if (!name || !type || isNaN(currentAmount)) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  try {
    const { error } = await supabase
      .from("assets")
      .update({
        name,
        type,
        current_amount: currentAmount,
        is_liability: isLiability,
        owner_type: ownerType,
        owner_profile_id: ownerType === "INDIVIDUAL" ? ownerProfileId : null,
        child_name: ownerType === "CHILD" ? childName : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assetId);

    if (error) throw error;

    // Log activity
    const label = isLiability ? "부채" : "자산";
    await createActivityLog(
      "UPDATE",
      "ASSET",
      `${label} "${name}" ₩${currentAmount.toLocaleString()}으로 수정`
    );

    // 자산 스냅샷 저장
    await saveAssetSnapshot(profile.household_id);

    revalidatePath("/assets");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function deleteAsset(assetId: string) {
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

  try {
    // Get asset details before deletion
    const { data: asset } = await supabase
      .from("assets")
      .select("name, current_amount, is_liability")
      .eq("id", assetId)
      .single();

    const { error } = await supabase.from("assets").delete().eq("id", assetId);

    if (error) throw error;

    // Log activity
    if (asset) {
      const label = asset.is_liability ? "부채" : "자산";
      await createActivityLog(
        "DELETE",
        "ASSET",
        `${label} "${asset.name}" ₩${Number(asset.current_amount).toLocaleString()} 삭제`
      );
    }

    // 자산 스냅샷 저장
    await saveAssetSnapshot(profile.household_id);

    revalidatePath("/assets");
    return { success: true };
  } catch (error: unknown) {
    return { error: getKoreanErrorMessage(error) };
  }
}

// 자산 히스토리 조회 (차트용)
export async function getAssetHistory(months: number = 6) {
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

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from("asset_history")
    .select("*")
    .eq("household_id", profile.household_id)
    .gte("record_date", startDate.toISOString().split("T")[0])
    .order("record_date", { ascending: true });

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data };
}
