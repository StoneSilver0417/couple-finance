import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type CachedProfile = {
  household_id: string | null;
  full_name: string | null;
  is_admin: boolean | null;
};

/**
 * 같은 서버 요청 안에서 인증 사용자 조회를 한 번만 수행한다.
 */
export const getCachedUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

/**
 * 같은 서버 요청 안에서 로그인 사용자의 프로필 조회를 한 번만 수행한다.
 */
export const getCachedProfile = cache(
  async (): Promise<CachedProfile | null> => {
    const user = await getCachedUser();

    if (!user) {
      return null;
    }

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("household_id, full_name, is_admin")
      .eq("id", user.id)
      .single();

    return profile;
  },
);
