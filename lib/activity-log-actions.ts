"use server";

// 클라이언트에서 호출 가능한 활동 기록 공개 액션 (조회/삭제)
// 기록 생성(logActivity)은 위조 방지를 위해 lib/activity-log.ts 내부 모듈로 격리됨

import { getHouseholdContext } from "@/lib/supabase/household-context";
import { getKoreanErrorMessage } from "@/lib/error-messages";
import type { ActivityLog } from "./activity-log";

export async function clearActivityLogs() {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, householdId } = ctx;

  try {
    const { error } = await supabase
      .from("activity_logs")
      .delete()
      .eq("household_id", householdId);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    console.error("활동 기록 삭제 실패:", error);
    return { error: getKoreanErrorMessage(error) };
  }
}

export async function getActivityLogs(limit: number = 20) {
  const ctx = await getHouseholdContext();
  if (!ctx.ok) return { error: ctx.error, data: [] };
  const { supabase, householdId } = ctx;

  // 외부에서 조작 가능한 인자이므로 조회 범위 제한
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 20, 1), 100);

  try {
    // 명시적 컬럼 선택 + NULL 날짜 필터링
    const { data: logs, error: logsError } = await supabase
      .from("activity_logs")
      .select(
        "id, household_id, user_id, action_type, target_table, description, created_at",
      )
      .eq("household_id", householdId)
      .not("created_at", "is", null)
      .gte("created_at", "2020-01-01T00:00:00Z")
      .order("created_at", { ascending: false })
      .limit(safeLimit);

    if (logsError) throw logsError;
    if (!logs || logs.length === 0) return { data: [] };

    // 사용자 정보 별도 조회
    const userIds = [...new Set(logs.map((log) => log.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    // 프로필 정보 매핑 + created_at을 문자열로 보장 (NULL은 빈 문자열)
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
    const logsWithProfiles = logs.map((log) => ({
      ...log,
      created_at: log.created_at ? String(log.created_at) : "",
      profiles: profileMap.get(log.user_id) || null,
    }));

    return { data: logsWithProfiles as ActivityLog[] };
  } catch (error: unknown) {
    console.error("활동 기록 조회 실패:", error);
    return { error: getKoreanErrorMessage(error), data: [] };
  }
}
