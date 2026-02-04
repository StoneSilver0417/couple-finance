"use client";

import { useState, useEffect } from "react";
import { createHousehold, joinHousehold } from "@/lib/household-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Heart, Loader2, UserPlus, Home, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ui/confirm-dialog";

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const confirm = useConfirm();

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        // Also check if they already have a household
        const { data: profile } = await supabase
          .from("profiles")
          .select("household_id")
          .eq("id", user.id)
          .single();

        if (profile?.household_id) {
          router.push("/");
        } else {
          setIsCheckingAuth(false);
        }
      }
    }
    checkUser();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFDFD]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  async function handleCreateHousehold(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await createHousehold(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    }
  }

  async function handleJoinHousehold(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await joinHousehold(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    const confirmed = await confirm({
      title: "로그아웃",
      message: "정말 로그아웃 하시겠습니까?",
      confirmText: "로그아웃",
      variant: "warning",
    });
    if (confirmed) {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("로그아웃되었습니다");
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

      <div className="w-full max-w-xl space-y-8 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-dark to-primary text-white shadow-lg shadow-primary/30 animate-bounce-subtle">
            <Heart className="h-8 w-8 fill-current" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-text-main mb-2">
              환영합니다!
            </h1>
            <p className="text-text-secondary font-medium max-w-sm mx-auto">
              부부 공동 가계부를 시작하기 위해 새로운 가구를 만들거나 배우자의
              초대를 수락하세요
            </p>
          </div>
        </div>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/40 p-1.5 rounded-2xl border border-white/60 backdrop-blur-sm mb-6 h-14">
            <TabsTrigger
              value="create"
              className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary-dark font-bold text-text-secondary transition-all"
            >
              <Home className="h-4 w-4" />새 가구 만들기
            </TabsTrigger>
            <TabsTrigger
              value="join"
              className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary-dark font-bold text-text-secondary transition-all"
            >
              <UserPlus className="h-4 w-4" />
              가구 참여하기
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <div className="glass-panel rounded-[2.5rem] p-8 shadow-glass border border-white/60">
              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-bold text-text-main">
                  새 가구 만들기
                </h3>
                <p className="text-sm text-text-secondary">
                  우리 집의 가계부를 시작하세요. 생성 후 배우자를 초대할 수
                  있습니다.
                </p>
              </div>
              <form onSubmit={handleCreateHousehold} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="household_name"
                    className="font-bold text-text-main"
                  >
                    가구 이름
                  </Label>
                  <Input
                    id="household_name"
                    name="household_name"
                    placeholder="예: 김철수♥이영희 가계부"
                    required
                    className="h-12 rounded-2xl border-white/60 bg-white/50 focus:bg-white font-medium"
                  />
                  <p className="text-xs text-text-secondary font-medium pl-1">
                    부부가 함께 사용할 가계부 이름을 입력하세요
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="user_name_create"
                    className="font-bold text-text-main"
                  >
                    내 이름
                  </Label>
                  <Input
                    id="user_name_create"
                    name="user_name"
                    placeholder="홍길동"
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
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    "가구 만들기"
                  )}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="join">
            <div className="glass-panel rounded-[2.5rem] p-8 shadow-glass border border-white/60">
              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-bold text-text-main">
                  가구 참여하기
                </h3>
                <p className="text-sm text-text-secondary">
                  배우자가 보내준 초대 코드를 입력하여 가구에 참여하세요.
                </p>
              </div>
              <form onSubmit={handleJoinHousehold} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="invite_code"
                    className="font-bold text-text-main"
                  >
                    초대 코드
                  </Label>
                  <Input
                    id="invite_code"
                    name="invite_code"
                    placeholder="ABCD1234"
                    required
                    className="h-12 rounded-2xl border-white/60 bg-white/50 focus:bg-white font-medium uppercase tracking-widest font-mono"
                    maxLength={8}
                  />
                  <p className="text-xs text-text-secondary font-medium pl-1">
                    배우자로부터 받은 8자리 코드를 입력하세요
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="user_name_join"
                    className="font-bold text-text-main"
                  >
                    내 이름
                  </Label>
                  <Input
                    id="user_name_join"
                    name="user_name"
                    placeholder="이영희"
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
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    "참여하기"
                  )}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col items-center gap-6 pt-4">
          <div className="text-center text-sm text-text-secondary font-medium">
            <p>가구는 최대 2명(부부)으로 구성됩니다</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 border border-white/60 text-red-500 font-bold text-sm hover:bg-white hover:shadow-sm transition-all active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            로그아웃하기
          </button>
        </div>
      </div>
    </div>
  );
}
