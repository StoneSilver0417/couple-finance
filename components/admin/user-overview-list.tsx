import {
  CalendarDays,
  Clock3,
  Home,
  LogIn,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AdminUserOverviewRow } from "@/types";

interface UserOverviewListProps {
  rows: AdminUserOverviewRow[];
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function formatDateTime(value: string | null): string {
  return value ? dateTimeFormatter.format(new Date(value)) : "기록 없음";
}

function getDisplayName(row: AdminUserOverviewRow): string {
  return row.full_name?.trim() || row.email?.split("@")[0] || "이름 없음";
}

export function UserOverviewList({ rows }: UserOverviewListProps) {
  return (
    <section aria-labelledby="user-list-title" className="space-y-3 pb-28">
      <h2 id="user-list-title" className="text-lg font-black text-slate-950">
        사용자 목록
      </h2>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white/90 px-6 py-14 text-center shadow-sm">
          <UsersEmptyState />
        </div>
      ) : (
        rows.map((row) => (
          <article
            key={row.user_id}
            className="rounded-3xl border border-slate-100 bg-white/95 p-5 shadow-sm"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-black text-slate-950">
                    {getDisplayName(row)}
                  </h3>
                  {row.is_admin && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black tracking-wide text-blue-700">
                      ADMIN
                    </span>
                  )}
                  {row.role === "OWNER" && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black text-violet-700">
                      가구장
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-slate-600">
                  {row.email ?? "이메일 없음"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                <Home className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="max-w-24 truncate">
                  {row.household_name ?? "가구 미설정"}
                </span>
              </div>
            </div>

            <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
              <MetaRow
                icon={CalendarDays}
                label="가입일"
                value={formatDate(row.joined_at)}
              />
              <MetaRow
                icon={LogIn}
                label="마지막 로그인"
                value={formatDateTime(row.last_sign_in_at)}
              />
              <MetaRow
                icon={Clock3}
                label="마지막 활동"
                value={formatDateTime(row.last_activity_at)}
              />
            </dl>
          </article>
        ))
      )}
    </section>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 font-medium text-slate-600">
        <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-right font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function UsersEmptyState() {
  return (
    <>
      <Users className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
      <p className="mt-3 font-bold text-slate-800">등록된 사용자가 없습니다</p>
    </>
  );
}
