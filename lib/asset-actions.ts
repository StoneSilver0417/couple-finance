"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createActivityLog } from "./activity-log-actions";

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

    revalidatePath("/assets");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "자산 추가에 실패했습니다." };
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

    revalidatePath("/assets");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "자산 수정에 실패했습니다." };
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

    revalidatePath("/assets");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "자산 삭제에 실패했습니다." };
  }
}
