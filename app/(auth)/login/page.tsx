"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Heart, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
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
            <Heart className="h-8 w-8 fill-current" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-text-main mb-2">
              부부 공동 가계부
            </h1>
            <p className="text-text-secondary font-medium">
              함께 관리하는 똑똑한 자산 관리
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-[2.5rem] p-8 shadow-glass border border-white/60">
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-black text-text-main">로그인</h2>
            <p className="text-sm text-text-secondary font-medium">
              이메일과 비밀번호를 입력하여 접속하세요
            </p>
          </div>

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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-bold text-text-main">
                  비밀번호
                </Label>
                <Link
                  href="/reset-password"
                  className="text-xs text-primary-dark hover:underline font-semibold"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="h-12 rounded-2xl border-white/60 bg-white/50 focus:bg-white font-medium"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl font-bold bg-gradient-to-tr from-primary-dark to-primary text-white hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 text-base border-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </Button>

            <div className="text-center text-sm text-text-secondary pt-2">
              계정이 없으신가요?{" "}
              <Link
                href="/signup"
                className="font-bold text-primary-dark hover:underline"
              >
                회원가입
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
