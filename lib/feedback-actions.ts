"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type FeedbackType = "bug" | "inquiry" | "suggestion" | "other";

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

  const type = formData.get("type") as FeedbackType;
  const content = formData.get("content") as string;
  const contact_email = formData.get("email") as string;
  const deviceInfoStr = formData.get("deviceInfo") as string;
  const device_info = deviceInfoStr ? JSON.parse(deviceInfoStr) : null;

  if (!content) {
    return { error: "내용을 입력해주세요." };
  }

  try {
    const { error } = await supabase.from("feedbacks").insert({
      user_id: user.id,
      type,
      content,
      contact_email: contact_email || user.email,
      device_info: device_info,
      status: "pending",
    });

    if (error) {
      console.error("Feedback submission error:", error);
      return {
        error: "문의 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: "알 수 없는 오류가 발생했습니다." };
  }
}
