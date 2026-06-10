// 서버 액션 공통 전처리 헬퍼 (서버 전용 모듈 — "use server" 아님)
// 주의: 이 파일에 "use server"를 붙이면 모든 export가 공개 엔드포인트가 되므로 금지

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type HouseholdContext =
  | {
      ok: true;
      supabase: ServerSupabaseClient;
      user: User;
      householdId: string;
    }
  | { ok: false; error: string };

/**
 * 로그인 사용자 확인 후 소속 가구 ID를 조회한다.
 * 가구 단위 데이터에 접근하는 모든 서버 액션의 단일 진입점.
 */
export async function getHouseholdContext(): Promise<HouseholdContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "로그인이 필요합니다." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    return { ok: false, error: "가구 정보가 없습니다." };
  }

  return { ok: true, supabase, user, householdId: profile.household_id };
}
