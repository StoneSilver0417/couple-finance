"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Heart, Loader2 } from "lucide-react";

export default function UpdatePasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setIsLoading(false);

    if (error) {
      toast.error("비밀번호 변경에 실패했습니다");
    } else {
      toast.success("비밀번호가 성공적으로 변경되었습니다");
      router.push("/login");
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
            <p className="text-text-secondary font-medium">새 비밀번호 설정</p>
          </div>
        </div>

        <div className="glass-panel rounded-[2.5rem] p-8 shadow-glass border border-white/60">
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-black text-text-main">
              비밀번호 변경
            </h2>
            <p className="text-sm text-text-secondary font-medium">
              새로운 비밀번호를 입력해주세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-text-main">
                새 비밀번호
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="h-12 rounded-2xl border-white/60 bg-white/50 focus:bg-white font-medium"
              />
              <p className="text-xs text-text-secondary font-medium">
                최소 6자 이상
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="font-bold text-text-main"
              >
                비밀번호 확인
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
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
                  변경 중...
                </>
              ) : (
                "비밀번호 변경"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
