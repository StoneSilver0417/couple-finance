import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AssetsPageClient from "./assets-page-client";

export default async function AssetsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    redirect("/onboarding");
  }

  // Fetch all assets with owner info
  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .eq("household_id", profile.household_id)
    .order("created_at", { ascending: false });

  // Fetch household members
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("household_id", profile.household_id);

  // 오늘 날짜 스냅샷 확인 및 생성
  const today = new Date().toISOString().split("T")[0];
  const { data: todaySnapshot } = await supabase
    .from("asset_history")
    .select("id")
    .eq("household_id", profile.household_id)
    .eq("record_date", today)
    .single();

  // 오늘 스냅샷이 없고 자산이 있으면 생성
  if (!todaySnapshot && assets && assets.length > 0) {
    let totalNetWorth = 0;
    const breakdown: Record<string, number> = {};

    assets.forEach((asset: any) => {
      const amount = asset.is_liability
        ? -Number(asset.current_amount)
        : Number(asset.current_amount);
      totalNetWorth += amount;

      const key =
        asset.owner_type === "INDIVIDUAL"
          ? asset.owner_profile_id || "JOINT"
          : asset.owner_type;

      breakdown[key] = (breakdown[key] || 0) + amount;
    });

    await supabase.from("asset_history").insert({
      household_id: profile.household_id,
      record_date: today,
      total_net_worth: totalNetWorth,
      breakdown_data: breakdown,
    });
  }

  // Fetch asset history (최근 6개월)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: assetHistory } = await supabase
    .from("asset_history")
    .select("*")
    .eq("household_id", profile.household_id)
    .gte("record_date", sixMonthsAgo.toISOString().split("T")[0])
    .order("record_date", { ascending: true });

  return (
    <AssetsPageClient
      assets={(assets || []) as any}
      members={members || []}
      currentUserId={user.id}
      assetHistory={assetHistory || []}
    />
  );
}
