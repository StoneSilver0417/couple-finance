"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ADMIN_EMAILS = [
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "admin@example.com",
  "waterdrop11@naver.com",
];

export async function isAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email);
}

export async function getAllFeedbacks() {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();

  // profiles 정보를 조인해서 사용자 이름도 가져옴
  const { data, error } = await supabase
    .from("feedbacks")
    .select(
      `
      *,
      profiles:user_id (
        full_name,
        email
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateFeedbackAnswer(
  id: string,
  comment: string,
  status: string,
) {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { error } = await supabase
    .from("feedbacks")
    .update({
      admin_comment: comment,
      status: status,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/feedbacks");
  revalidatePath("/settings"); // 사용자 탭 갱신
}
