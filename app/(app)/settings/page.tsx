import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Users,
  Key,
  Sparkles,
  ChevronRight,
  Target,
  Wallet,
  Smartphone,
  ArrowLeft,
} from "lucide-react";
import { CopyInviteButton } from "./copy-invite-button";
import { PWAInstallButton } from "@/components/pwa-install-button";
import { LogoutButton } from "./logout-button";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, full_name")
    .eq("id", user.id)
    .single();

  // 가구 정보가 없으면 onboarding으로
  if (!profile?.household_id) {
    return (
      <div className="flex-1 w-full animate-fade-in pb-8">
        <header className="flex items-center gap-4 p-6 pt-10">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="group rounded-full bg-white/60 hover:bg-white shadow-soft transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5 text-text-main group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
          <div>
            <p className="text-xs text-text-secondary font-bold tracking-wider uppercase mb-0.5">
              Configuration
            </p>
            <h1 className="text-2xl font-black text-text-main tracking-tight">
              설정
            </h1>
          </div>
        </header>

        <div className="px-6 space-y-6">
          <div className="glass-panel w-full rounded-[2.5rem] p-8 shadow-glass text-center">
            <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-indigo-500" />
            </div>
            <h2 className="text-xl font-bold text-text-main mb-2">
              가구 설정이 필요합니다
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              가계부를 사용하려면 먼저 가구를 만들거나 참여해야 합니다.
            </p>
            <Link href="/onboarding">
              <Button className="rounded-2xl h-12 px-6 bg-gradient-to-tr from-primary-dark to-primary text-white font-bold hover:scale-[1.02] active:scale-95 transition-all border-none shadow-lg shadow-primary/20">
                가구 설정하러 가기
              </Button>
            </Link>
          </div>

          <LogoutButton />
        </div>

        <div className="h-24" />
      </div>
    );
  }

  // 병렬 쿼리
  const [householdResult, membersResult] = await Promise.all([
    supabase
      .from("households")
      .select("name, invite_code")
      .eq("id", profile.household_id)
      .single(),
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("household_id", profile.household_id),
  ]);

  const household = householdResult.data;
  const members = membersResult.data || [];

  return (
    <div className="flex-1 w-full animate-fade-in pb-8">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 pt-10">
        <Link href="/">
          <Button
            variant="ghost"
            size="icon"
            className="group rounded-full bg-white/60 hover:bg-white shadow-soft transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 text-text-main group-hover:-translate-x-1 transition-transform" />
          </Button>
        </Link>
        <div>
          <p className="text-xs text-text-secondary font-bold tracking-wider uppercase mb-0.5">
            Configuration
          </p>
          <h1 className="text-2xl font-black text-text-main tracking-tight">
            설정
          </h1>
        </div>
      </header>

      <div className="px-6 space-y-6">
        {/* Profile Card */}
        <div className="glass-panel w-full rounded-[2.5rem] p-6 shadow-glass relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-50"></div>

          <div className="flex items-center gap-4 relative z-10 mb-6">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary-soft to-accent-peach flex items-center justify-center text-2xl shadow-candy border-2 border-white">
              <Users className="w-6 h-6 text-primary-dark" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-main">
                {household?.name}
              </h2>
              <p className="text-sm text-text-secondary font-medium">
                Household Settings
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {members.map((member, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-white/40 rounded-[1.5rem] border border-white/50 backdrop-blur-sm"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary-dark font-black text-sm ring-2 ring-white">
                  {member.full_name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="font-bold text-sm text-text-main">
                    {member.full_name}
                  </p>
                  <p className="text-xs text-text-secondary">{member.email}</p>
                </div>
              </div>
            ))}
          </div>

          {members.length < 2 && (
            <div className="mt-4 p-4 bg-accent-peach/30 rounded-[1.5rem] border border-accent-coral/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-primary-dark uppercase flex items-center gap-1">
                  <Key className="w-3 h-3" /> Invite Code
                </span>
                <CopyInviteButton inviteCode={household?.invite_code || ""} />
              </div>
              <div className="text-center bg-white/60 rounded-xl p-2 border border-white/40 shadow-sm">
                <p className="text-2xl font-black text-text-main tracking-widest font-mono">
                  {household?.invite_code}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 gap-4">
          {[
            {
              href: "/settings/budgets",
              title: "예산 설정",
              desc: "목표 금액 설정",
              icon: Target,
              color: "text-purple-500",
              bg: "bg-purple-50",
            },
            {
              href: "/settings/categories",
              title: "카테고리",
              desc: "분류 관리",
              icon: Sparkles,
              color: "text-pink-500",
              bg: "bg-pink-50",
            },
            {
              href: "/assets",
              title: "자산 관리",
              desc: "포트폴리오",
              icon: Wallet,
              color: "text-emerald-500",
              bg: "bg-emerald-50",
            },
          ].map((item, i) => (
            <Link key={i} href={item.href}>
              <div className="glass-panel p-5 rounded-[2rem] flex items-center justify-between cursor-pointer group hover:bg-white/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-glow">
                <div className="flex items-center gap-4">
                  <div
                    className={`h-12 w-12 rounded-[1.2rem] ${item.bg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
                  >
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-text-main">
                      {item.title}
                    </p>
                    <p className="text-xs text-text-secondary font-medium">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-white/50 flex items-center justify-center border border-white/60 group-hover:bg-primary group-hover:text-white transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <LogoutButton />

        {/* Utilities */}
        <div className="glass-panel p-5 rounded-[2rem] bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Smartphone className="h-5 w-5 text-accent-coral" />
            </div>
            <div>
              <p className="font-bold text-lg text-white">앱 설치하기</p>
              <p className="text-xs text-gray-400">
                홈 화면에 추가하여 더 편하게 쓰세요
              </p>
            </div>
          </div>

          <PWAInstallButton />
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="h-24" />
    </div>
  );
}
