// 활동 기록 내부 모듈 (서버 전용 — "use server" 아님)
// 기존에는 createActivityLog가 공개 서버 액션으로 노출되어
// 누구나 임의 내용으로 로그를 위조 호출할 수 있었음 → 내부 함수로 격리

import type { ServerSupabaseClient } from "@/lib/supabase/household-context";

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
  } | null;
}

/**
 * 활동 기록 저장. 기록 실패가 본 작업(거래 추가 등)을 막지 않도록
 * 에러는 내부에서 흡수하고 콘솔에만 남긴다.
 */
export async function logActivity(
  supabase: ServerSupabaseClient,
  householdId: string,
  userId: string,
  actionType: ActivityAction,
  targetTable: ActivityTarget,
  description: string,
): Promise<void> {
  try {
    const { error } = await supabase.from("activity_logs").insert({
      household_id: householdId,
      user_id: userId,
      action_type: actionType,
      target_table: targetTable,
      description,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;
  } catch (error) {
    console.error("활동 기록 저장 실패:", error);
  }
}
