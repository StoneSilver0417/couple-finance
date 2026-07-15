import { Home, UserPlus, Users } from "lucide-react";

interface UserOverviewStatsProps {
  totalUsers: number;
  totalHouseholds: number;
  newUsersThisMonth: number;
}

export function UserOverviewStats({
  totalUsers,
  totalHouseholds,
  newUsersThisMonth,
}: UserOverviewStatsProps) {
  const stats = [
    {
      label: "총 사용자",
      value: totalUsers,
      icon: Users,
      iconClassName: "bg-blue-50 text-blue-600",
    },
    {
      label: "총 가구",
      value: totalHouseholds,
      icon: Home,
      iconClassName: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "이번 달 신규",
      value: newUsersThisMonth,
      icon: UserPlus,
      iconClassName: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <section aria-label="사용자 현황 요약" className="mb-6 grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-sm sm:p-4"
        >
          <div
            className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${stat.iconClassName}`}
          >
            <stat.icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
            {stat.value.toLocaleString("ko-KR")}
          </p>
          <p className="mt-1 text-xs font-semibold leading-4 text-slate-600">
            {stat.label}
          </p>
        </div>
      ))}
    </section>
  );
}
