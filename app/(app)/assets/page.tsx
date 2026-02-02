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
