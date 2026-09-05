import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { UserOverviewList } from "@/components/admin/user-overview-list";
import { UserOverviewStats } from "@/components/admin/user-overview-stats";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/admin-actions";
import { createClient } from "@/lib/supabase/server";
import type { AdminUserOverviewRow } from "@/types";

function getYearMonthSeoul(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);

  return `${year}-${String(month).padStart(2, "0")}`;
}

export default async function AdminUsersPage() {
  const isUserAdmin = await isAdmin();

  if (!isUserAdmin) {
    redirect("/settings");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_get_user_overview");

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as AdminUserOverviewRow[];
  const currentYearMonth = getYearMonthSeoul(new Date());
  const totalHouseholds = new Set(
    rows.flatMap((row) => (row.household_id ? [row.household_id] : [])),
  ).size;
  const newUsersThisMonth = rows.filter(
    (row) => getYearMonthSeoul(new Date(row.joined_at)) === currentYearMonth,
  ).length;

  return (
    <div className="min-h-screen w-full flex-1 animate-fade-in">
      <header className="sticky top-0 z-20 flex items-center gap-4 bg-[#FDFDFD]/90 p-6 pt-10 backdrop-blur-xl">
        <Link href="/settings">
          <Button
            variant="ghost"
            size="icon"
            className="group rounded-full bg-white/60 shadow-soft transition-all duration-300 hover:bg-white"
          >
            <ArrowLeft className="h-5 w-5 text-text-main transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            <span className="sr-only">설정으로 돌아가기</span>
          </Button>
        </Link>
        <div>
          <p className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-primary">
            Admin Console
          </p>
          <h1 className="text-2xl font-black tracking-tight text-text-main">
            사용자 현황
          </h1>
        </div>
      </header>

      <main className="px-4 sm:px-6">
        <AdminNav active="users" />
        <UserOverviewStats
          totalUsers={rows.length}
          totalHouseholds={totalHouseholds}
          newUsersThisMonth={newUsersThisMonth}
        />
        <UserOverviewList rows={rows} />
      </main>
    </div>
  );
}
