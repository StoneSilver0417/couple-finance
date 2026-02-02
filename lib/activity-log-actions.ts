"use server";

import { createClient } from "@/lib/supabase/server";

export type ActivityAction = "CREATE" | "UPDATE" | "DELETE";
export type ActivityTarget = "TRANSACTION" | "ASSET" | "BUDGET" | "CATEGORY";

export interface ActivityLog {
  id: string;
  household_id: string;
  user_id: string;
  action_type: ActivityAction;
  target_table: ActivityTarget;
  description: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export async function createActivityLog(
  actionType: ActivityAction,
  targetTable: ActivityTarget,
  description: string
) {
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

  try {
    const { error } = await supabase.from("activity_logs").insert({
      household_id: profile.household_id,
      user_id: user.id,
      action_type: actionType,
      target_table: targetTable,
      description,
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Activity log error:", error);
    return { error: error.message };
  }
}

export async function getActivityLogs(limit: number = 20) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다.", data: [] };

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) return { error: "가구 정보가 없습니다.", data: [] };

  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .select(
        `
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `
      )
      .eq("household_id", profile.household_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data as ActivityLog[] };
  } catch (error: any) {
    console.error("Fetch activity logs error:", error);
    return { error: error.message, data: [] };
  }
}
