"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, CircleCheck, Heart, Info, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setIsLoading(false);

    if (error) {
      toast.error("비밀번호 재설정 메일 발송에 실패했습니다");
    } else {
      setEmailSent(true);
      toast.success("비밀번호 재설정 링크가 이메일로 발송되었습니다");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FFF0F3] via-[#F0F4FF] to-[#FFF8E1] px-4 py-12 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-60 animate-float"></div>
      <div
        className="absolute bottom-20 right-10 w-80 h-80 bg-accent-coral/10 rounded-full blur-3xl opacity-60 animate-float"
        style={{ animationDelay: "1s" }}
      ></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-dark to-primary text-white shadow-lg shadow-primary/30 animate-bounce-subtle">
            <Heart className="h-8 w-8 fill-current" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-text-main mb-2">
              부부 공동 가계부
            </h1>
            <p className="text-text-secondary font-medium">비밀번호 재설정</p>
          </div>
        </div>

        <div className="glass-panel rounded-[2.5rem] p-8 shadow-glass border border-white/60">
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-black text-text-main">
              비밀번호 찾기
            </h2>
            <p className="text-sm text-text-secondary font-medium">
              {emailSent
                ? "이메일을 확인해주세요"
                : "가입하신 이메일 주소를 입력하세요"}
            </p>
          </div>

          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-text-main">
                  이메일
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="h-12 rounded-2xl border-white/60 bg-white/50 focus:bg-white font-medium"
                />
              </div>

              <div className="rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100">
                <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-text-main">
                  <Info className="h-4 w-4" aria-hidden="true" />
                  안내
                </p>
                <p className="break-keep text-xs text-text-secondary">
                  입력하신 이메일로 비밀번호 재설정 링크가 발송됩니다.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl font-bold bg-gradient-to-tr from-primary-dark to-primary text-white hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 text-base border-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    발송 중...
                  </>
                ) : (
                  "재설정 링크 받기"
                )}
              </Button>

              <Link
                href="/login"
                className="inline-flex min-h-11 w-full items-center justify-center gap-1 px-2 text-sm font-medium text-text-secondary hover:text-text-main"
              >
                <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                로그인으로 돌아가기
              </Link>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl bg-green-50 p-6 text-center border border-green-100">
                <CircleCheck className="mx-auto mb-3 h-10 w-10 text-emerald-600" aria-hidden="true" />
                <p className="text-sm font-bold text-text-main mb-2">
                  이메일이 발송되었습니다
                </p>
                <p className="text-xs text-text-secondary">
                  이메일함을 확인하시고 링크를 클릭하여 비밀번호를 재설정하세요.
                </p>
              </div>
              <Link href="/login">
                <Button className="w-full h-14 rounded-2xl font-bold bg-gradient-to-tr from-primary-dark to-primary text-white hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 text-base border-none">
                  로그인 페이지로 이동
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
