"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getKoreanErrorMessage } from "@/lib/error-messages";
import { getTrimmedString } from "@/lib/validation";

// 이메일/비밀번호 공통 추출·검증 (형식 검증은 Supabase가 수행, 여기서는 존재·길이만 확인)
function getCredentials(formData: FormData) {
  const email = getTrimmedString(formData.get("email"), 320);
  const password = formData.get("password");
  if (!email || typeof password !== "string" || password.length === 0) {
    return null;
  }
  return { email, password };
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = getCredentials(formData);
  if (!data) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: getKoreanErrorMessage(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = getCredentials(formData);
  if (!data) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }
  if (data.password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }

  // 이메일 확인 없이 바로 로그인 가능하도록 설정
  const { error } = await supabase.auth.signUp({
    ...data,
    options: {
      emailRedirectTo: undefined,
    },
  });

  if (error) {
    return { error: getKoreanErrorMessage(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
