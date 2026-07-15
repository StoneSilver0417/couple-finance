import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Settings, Sparkles } from "lucide-react";
import { GenerateReportCard } from "@/components/reports/generate-report-card";
import { ReportView } from "@/components/reports/report-view";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isValidYearMonth } from "@/lib/validation";

export const maxDuration = 60;

function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function getCurrentYearMonth(): { year: number; month: number; value: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return { year, month, value: formatYearMonth(year, month) };
}

function isFutureMonth(year: number, month: number, current: { year: number; month: number }) {
  return year > current.year || (year === current.year && month > current.month);
}

export default async function MonthlyReportPage({
  params,
}: {
  params: Promise<{ yearMonth: string }>;
}) {
  const { yearMonth } = await params;
  const current = getCurrentYearMonth();
  const match = /^(\d{4})-(\d{2})$/.exec(yearMonth);
  const year = match ? Number(match[1]) : Number.NaN;
  const month = match ? Number(match[2]) : Number.NaN;

  if (
    !match ||
    !isValidYearMonth(year, month) ||
    isFutureMonth(year, month, current)
  ) {
    redirect(`/reports/${current.value}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();
  if (!profile?.household_id) redirect("/onboarding");

  const [reportResult, settingResult] = await Promise.all([
    supabase
      .from("monthly_reports")
      .select("content, model, created_at, updated_at")
      .eq("household_id", profile.household_id)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle(),
    supabase
      .from("household_ai_settings")
      .select("id")
      .eq("household_id", profile.household_id)
      .maybeSingle(),
  ]);

  if (reportResult.error || settingResult.error) {
    console.error("월간 AI 보고서 페이지 조회 실패:", {
      reportError: reportResult.error,
      settingError: settingResult.error,
    });
  }

  const report = reportResult.data;
  const hasApiKey = Boolean(settingResult.data?.id);
  const previousDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const previousYearMonth = formatYearMonth(
    previousDate.getFullYear(),
    previousDate.getMonth() + 1,
  );
  const nextYear = nextDate.getFullYear();
  const nextMonth = nextDate.getMonth() + 1;
  const nextYearMonth = formatYearMonth(nextYear, nextMonth);
  const nextDisabled = isFutureMonth(nextYear, nextMonth, current);
  const generatedAt = report
    ? new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(report.updated_at || report.created_at))
    : null;

  return (
    <div className="flex-1 w-full animate-fade-in pb-8">
      <header className="flex items-center gap-4 p-6 pt-10">
        <Link href="/">
          <Button
            variant="ghost"
            size="icon"
            aria-label="대시보드로 돌아가기"
            className="group cursor-pointer rounded-full bg-white/60 shadow-soft transition-colors hover:bg-white"
          >
            <ArrowLeft className="h-5 w-5 text-text-main transition-transform group-hover:-translate-x-0.5" />
          </Button>
        </Link>
        <div>
          <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-text-secondary">
            Monthly AI Report
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-text-main">
            월간 AI 보고서 <Sparkles className="h-5 w-5 text-violet-500" />
          </h1>
        </div>
      </header>

      <div className="px-4 sm:px-6">
        <nav
          aria-label="보고서 월 이동"
          className="glass-panel mb-6 flex items-center justify-between rounded-2xl border border-white/60 p-2 shadow-sm"
        >
          <Link href={`/reports/${previousYearMonth}`}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="이전 달 보고서"
              className="cursor-pointer rounded-xl hover:bg-white/60"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <span className="font-black text-text-main">
            {year}년 {month}월
          </span>
          {nextDisabled ? (
            <Button
              variant="ghost"
              size="icon"
              disabled
              aria-label="다음 달 보고서 없음"
              className="rounded-xl"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          ) : (
            <Link href={`/reports/${nextYearMonth}`}>
              <Button
                variant="ghost"
                size="icon"
                aria-label="다음 달 보고서"
                className="cursor-pointer rounded-xl hover:bg-white/60"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </nav>

        {report ? (
          <div className="space-y-5">
            <ReportView content={report.content} />
            <div className="rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-sm">
              <div className="mb-3 text-sm leading-6 text-slate-600">
                <p>마지막 생성: {generatedAt}</p>
                <p>사용 모델: {report.model}</p>
              </div>
              <GenerateReportCard yearMonth={yearMonth} mode="regenerate" />
            </div>
          </div>
        ) : hasApiKey ? (
          <GenerateReportCard yearMonth={yearMonth} />
        ) : (
          <section className="glass-panel rounded-[2rem] border border-white/70 p-6 text-center shadow-glass">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Settings className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-black text-text-main">
              Gemini API 키를 먼저 등록해주세요
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              개인 무료 API 키를 등록하면 이 가구의 월간 금융 집계를 AI로 분석할 수
              있어요.
            </p>
            <Link href="/settings">
              <Button className="mt-6 h-12 cursor-pointer rounded-xl px-6 font-bold">
                <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                설정에서 키 등록하기
              </Button>
            </Link>
          </section>
        )}
      </div>

      <div className="h-24" />
    </div>
  );
}
