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
    // 먼저 활동 로그 조회
    const { data: logs, error: logsError } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("household_id", profile.household_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (logsError) throw logsError;
    if (!logs || logs.length === 0) return { data: [] };

    // 사용자 정보 별도 조회
    const userIds = [...new Set(logs.map(log => log.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    // 프로필 정보 매핑
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const logsWithProfiles = logs.map(log => ({
      ...log,
      profiles: profileMap.get(log.user_id) || null,
    }));

    return { data: logsWithProfiles as ActivityLog[] };
  } catch (error: any) {
    console.error("Fetch activity logs error:", error);
    return { error: error.message, data: [] };
  }
}
