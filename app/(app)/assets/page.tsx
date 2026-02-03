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

  // 병렬 쿼리 실행 (성능 최적화)
  const today = new Date().toISOString().split("T")[0];
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [assetsResult, membersResult, todaySnapshotResult, assetHistoryResult] =
    await Promise.all([
      supabase
        .from("assets")
        .select("*")
        .eq("household_id", profile.household_id)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("household_id", profile.household_id),
      supabase
        .from("asset_history")
        .select("id")
        .eq("household_id", profile.household_id)
        .eq("record_date", today)
        .single(),
      supabase
        .from("asset_history")
        .select("*")
        .eq("household_id", profile.household_id)
        .gte("record_date", sixMonthsAgo.toISOString().split("T")[0])
        .order("record_date", { ascending: true }),
    ]);

  const assets = assetsResult.data;
  const members = membersResult.data;
  const todaySnapshot = todaySnapshotResult.data;
  const assetHistory = assetHistoryResult.data;

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

  return (
    <AssetsPageClient
      assets={(assets || []) as any}
      members={members || []}
      currentUserId={user.id}
      assetHistory={assetHistory || []}
    />
  );
}
