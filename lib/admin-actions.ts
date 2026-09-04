"use server";

import { createClient } from "@/lib/supabase/server";
import { getCachedProfile } from "@/lib/supabase/request-context";
import { revalidatePath } from "next/cache";

export async function isAdmin() {
  const profile = await getCachedProfile();
  return !!profile?.is_admin;
}

export async function getAllFeedbacks(limit?: number, offset: number = 0) {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();

  // profiles 정보를 조인해서 사용자 이름도 가져옴
  let query = supabase
    .from("feedbacks")
    .select("*, profiles:user_id(full_name)")
    .order("created_at", { ascending: false });

  if (limit !== undefined) {
    const safeLimit = Number.isFinite(limit)
      ? Math.min(100, Math.max(1, Math.trunc(limit)))
      : 1;
    const safeOffset = Number.isFinite(offset)
      ? Math.max(0, Math.trunc(offset))
      : 0;
    query = query.range(safeOffset, safeOffset + safeLimit - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// 피드백 상태 화이트리스트 (components/admin/feedback-admin-list.tsx의 STATUS_CONFIG와 일치)
const FEEDBACK_STATUSES = [
  "pending",
  "in_progress",
  "resolved",
  "closed",
] as const;

export async function updateFeedbackAnswer(
  id: string,
  comment: string,
  status: string,
) {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) throw new Error("Unauthorized");

  // 외부 입력 검증: 상태 화이트리스트 + 답변 길이 제한
  if (!FEEDBACK_STATUSES.includes(status as (typeof FEEDBACK_STATUSES)[number])) {
    throw new Error("유효하지 않은 상태값입니다.");
  }
  const trimmedComment = comment?.trim();
  if (!trimmedComment || trimmedComment.length > 5000) {
    throw new Error("답변 내용이 비어있거나 너무 깁니다. (최대 5,000자)");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("feedbacks")
    .update({
      admin_comment: trimmedComment,
      status: status,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/feedbacks");
  revalidatePath("/settings"); // 사용자 탭 갱신
}

export async function getPendingFeedbackCount() {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) return 0;

  const supabase = await createClient();

  // 답변이 없는(admin_comment가 null) 피드백 개수 조회
  const { count, error } = await supabase
    .from("feedbacks")
    .select("*", { count: "exact", head: true })
    .is("admin_comment", null);

  if (error) {
    console.error("Error fetching pending feedback count:", error);
    return 0;
  }

  return count || 0;
}


export async function forceClearReportsForUser(userId: string) {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_reports")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
  return { success: true };
}
