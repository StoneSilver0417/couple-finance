"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getTrimmedString } from "@/lib/validation";

const FEEDBACK_TYPES = ["bug", "inquiry", "suggestion", "other"] as const;
type FeedbackType = (typeof FEEDBACK_TYPES)[number];

function isFeedbackType(value: unknown): value is FeedbackType {
  return FEEDBACK_TYPES.includes(value as FeedbackType);
}

interface ContactFormState {
  error?: string;
  success?: boolean;
}

export async function submitFeedback(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 외부 입력 검증: 유형 화이트리스트 + 길이 제한
  const rawType = formData.get("type");
  const type = isFeedbackType(rawType) ? rawType : "other";
  const content = getTrimmedString(formData.get("content"), 5000);
  const contactEmail = getTrimmedString(formData.get("email"), 320);

  if (!content) {
    return { error: "내용을 입력해주세요. (최대 5,000자)" };
  }

  // 조작된 JSON으로 액션이 죽지 않도록 안전하게 파싱하고 크기를 제한
  let deviceInfo: unknown = null;
  const deviceInfoStr = formData.get("deviceInfo");
  if (typeof deviceInfoStr === "string" && deviceInfoStr.length <= 2000) {
    try {
      deviceInfo = JSON.parse(deviceInfoStr);
    } catch {
      deviceInfo = null;
    }
  }

  try {
    const { error } = await supabase.from("feedbacks").insert({
      user_id: user.id,
      type,
      content,
      contact_email: contactEmail || user.email,
      device_info: deviceInfo,
      status: "pending",
    });

    if (error) {
      console.error("피드백 등록 실패:", error);
      return {
        error: "문의 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("피드백 등록 중 예기치 못한 오류:", error);
    return { error: "알 수 없는 오류가 발생했습니다." };
  }
}

export async function getMyFeedbacks() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("feedbacks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data || [];
}
