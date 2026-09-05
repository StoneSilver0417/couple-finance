import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  GeneratePeriodicReportCard,
  GenerateReportCard,
} from "@/components/reports/generate-report-card";
import {
  ReportPeriodTabs,
  type ReportPeriodType,
} from "@/components/reports/report-period-tabs";
import { ReportView } from "@/components/reports/report-view";
import { Button } from "@/components/ui/button";
import { getPeriodRange } from "@/lib/period-range";
import { createClient } from "@/lib/supabase/server";
import { isValidYearMonth } from "@/lib/validation";

export const maxDuration = 60;

type ParsedReportPeriod =
  | {
      type: "month";
      key: string;
      year: number;
      month: number;
    }
  | {
      type: "quarter";
      key: string;
      year: number;
      quarter: number;
    }
  | {
      type: "half";
      key: string;
      year: number;
      half: number;
    }
  | {
      type: "year";
      key: string;
      year: number;
    };

interface CurrentYearMonth {
  year: number;
  month: number;
  value: string;
}

function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function getCurrentYearMonth(): CurrentYearMonth {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return { year, month, value: formatYearMonth(year, month) };
}

function getCurrentPeriodKeys(
  current: CurrentYearMonth,
): Record<ReportPeriodType, string> {
  return {
    month: current.value,
    quarter: `${current.year}-Q${Math.ceil(current.month / 3)}`,
    half: `${current.year}-H${Math.ceil(current.month / 6)}`,
    year: String(current.year),
  };
}

function parseReportPeriod(value: string): ParsedReportPeriod | null {
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(value);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    return isValidYearMonth(year, month)
      ? { type: "month", key: value, year, month }
      : null;
  }

  const quarterMatch = /^(\d{4})-Q([1-4])$/.exec(value);
  if (quarterMatch) {
    const year = Number(quarterMatch[1]);
    const quarter = Number(quarterMatch[2]);
    return isValidYearMonth(year, 1)
      ? { type: "quarter", key: value, year, quarter }
      : null;
  }

  const halfMatch = /^(\d{4})-H([1-2])$/.exec(value);
  if (halfMatch) {
    const year = Number(halfMatch[1]);
    const half = Number(halfMatch[2]);
    return isValidYearMonth(year, 1)
      ? { type: "half", key: value, year, half }
      : null;
  }

  const yearMatch = /^(\d{4})$/.exec(value);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    return isValidYearMonth(year, 1)
      ? { type: "year", key: value, year }
      : null;
  }

  return null;
}

function isFuturePeriod(
  period: ParsedReportPeriod,
  current: CurrentYearMonth,
): boolean {
  if (period.year !== current.year) return period.year > current.year;
  if (period.type === "month") return period.month > current.month;
  if (period.type === "quarter") {
    return period.quarter > Math.ceil(current.month / 3);
  }
  if (period.type === "half") {
    return period.half > Math.ceil(current.month / 6);
  }
  return false;
}

function shiftPeriodKey(
  period: ParsedReportPeriod,
  offset: -1 | 1,
): string {
  if (period.type === "month") {
    const date = new Date(period.year, period.month - 1 + offset, 1);
    return formatYearMonth(date.getFullYear(), date.getMonth() + 1);
  }

  if (period.type === "quarter") {
    const absoluteQuarter = period.year * 4 + period.quarter - 1 + offset;
    const year = Math.floor(absoluteQuarter / 4);
    const quarter = (absoluteQuarter % 4) + 1;
    return `${year}-Q${quarter}`;
  }

  if (period.type === "half") {
    const absoluteHalf = period.year * 2 + period.half - 1 + offset;
    const year = Math.floor(absoluteHalf / 2);
    const half = (absoluteHalf % 2) + 1;
    return `${year}-H${half}`;
  }

  return String(period.year + offset);
}

function getPeriodDisplay(period: ParsedReportPeriod): string {
  if (period.type === "month") {
    return `${period.year}년 ${period.month}월`;
  }
  if (period.type === "quarter") {
    return `${period.year}년 ${period.quarter}분기`;
  }
  if (period.type === "half") {
    return `${period.year}년 ${period.half === 1 ? "상반기" : "하반기"}`;
  }
  return `${period.year}년`;
}

function getReportName(type: ReportPeriodType): string {
  if (type === "month") return "월간";
  if (type === "quarter") return "분기";
  if (type === "half") return "반기";
  return "연간";
}

function getEnglishReportName(type: ReportPeriodType): string {
  if (type === "month") return "Monthly AI Report";
  if (type === "quarter") return "Quarterly AI Report";
  if (type === "half") return "Half-Year AI Report";
  return "Annual AI Report";
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ period: string }>;
}) {
  const { period: periodParam } = await params;
  const current = getCurrentYearMonth();
  const currentPeriodKeys = getCurrentPeriodKeys(current);
  const period = parseReportPeriod(periodParam);

  if (!period) {
    redirect(`/reports/${current.value}`);
  }
  if (isFuturePeriod(period, current)) {
    redirect(`/reports/${currentPeriodKeys[period.type]}`);
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

  const reportQuery =
    period.type === "month"
      ? supabase
          .from("monthly_reports")
          .select("content, model, created_at, updated_at")
          .eq("household_id", profile.household_id)
          .eq("year", period.year)
          .eq("month", period.month)
          .maybeSingle()
      : supabase
          .from("periodic_reports")
          .select("content, model, created_at, updated_at")
          .eq("household_id", profile.household_id)
          .eq("period_type", period.type)
          .eq("period_key", period.key)
          .maybeSingle();

  const [reportResult, settingResult] = await Promise.all([
    reportQuery,
    supabase
      .from("household_ai_settings")
      .select("id")
      .eq("household_id", profile.household_id)
      .maybeSingle(),
  ]);

  if (reportResult.error || settingResult.error) {
    console.error("AI 보고서 페이지 조회 실패:", {
      periodType: period.type,
      reportError: reportResult.error,
      settingError: settingResult.error,
    });
  }

  const report = reportResult.data;
  const hasApiKey = Boolean(settingResult.data?.id);
  const previousPeriodKey = shiftPeriodKey(period, -1);
  const previousPeriod = parseReportPeriod(previousPeriodKey);
  const nextPeriodKey = shiftPeriodKey(period, 1);
  const nextPeriod = parseReportPeriod(nextPeriodKey);
  const previousDisabled = !previousPeriod;
  const nextDisabled =
    !nextPeriod || isFuturePeriod(nextPeriod, current);
  const reportName = getReportName(period.type);
  const labels =
    period.type === "month"
      ? { periodLabel: "이번 달", previousPeriodLabel: "전월" }
      : getPeriodRange(period.type, period.key);
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
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="group size-11 cursor-pointer rounded-full bg-white/60 shadow-soft transition-colors hover:bg-white"
        >
          <Link href="/" aria-label="대시보드로 돌아가기">
            <ArrowLeft className="h-5 w-5 text-text-main transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          </Link>
        </Button>
        <div>
          <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-text-secondary">
            {getEnglishReportName(period.type)}
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-text-main">
            {reportName} AI 보고서{" "}
            <Sparkles className="h-5 w-5 text-violet-500" aria-hidden="true" />
          </h1>
        </div>
      </header>

      <div className="px-4 sm:px-6">
        <ReportPeriodTabs
          activeType={period.type}
          currentPeriodKeys={currentPeriodKeys}
        />

        <nav
          aria-label={`${reportName} 보고서 기간 이동`}
          className="glass-panel mb-6 flex items-center justify-between rounded-2xl border border-white/60 p-2 shadow-sm"
        >
          {previousDisabled ? (
            <Button
              variant="ghost"
              size="icon"
              disabled
              aria-label={`이전 ${reportName} 보고서 없음`}
              className="size-11 rounded-xl"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-11 cursor-pointer rounded-xl hover:bg-white/60"
            >
              <Link
                href={`/reports/${previousPeriodKey}`}
                aria-label={`이전 ${reportName} 보고서`}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          )}
          <span className="font-black text-text-main">
            {getPeriodDisplay(period)}
          </span>
          {nextDisabled ? (
            <Button
              variant="ghost"
              size="icon"
              disabled
              aria-label={`다음 ${reportName} 보고서 없음`}
              className="size-11 rounded-xl"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-11 cursor-pointer rounded-xl hover:bg-white/60"
            >
              <Link
                href={`/reports/${nextPeriodKey}`}
                aria-label={`다음 ${reportName} 보고서`}
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </nav>

        {report ? (
          <div className="space-y-5">
            <ReportView
              content={report.content}
              periodLabel={labels.periodLabel}
              previousPeriodLabel={labels.previousPeriodLabel}
            />
            <div className="rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-sm">
              <div className="mb-3 text-sm leading-6 text-slate-600">
                <p>마지막 생성: {generatedAt}</p>
                <p>사용 모델: {report.model}</p>
              </div>
              {period.type === "month" ? (
                <GenerateReportCard
                  key={period.key}
                  yearMonth={period.key}
                  mode="regenerate"
                />
              ) : (
                <GeneratePeriodicReportCard
                  key={period.key}
                  periodType={period.type}
                  periodKey={period.key}
                  periodLabel={labels.periodLabel}
                  reportName={reportName}
                  mode="regenerate"
                />
              )}
            </div>
          </div>
        ) : hasApiKey ? (
          period.type === "month" ? (
            <GenerateReportCard key={period.key} yearMonth={period.key} />
          ) : (
            <GeneratePeriodicReportCard
              key={period.key}
              periodType={period.type}
              periodKey={period.key}
              periodLabel={labels.periodLabel}
              reportName={reportName}
            />
          )
        ) : (
          <section className="glass-panel rounded-[2rem] border border-white/70 p-6 text-center shadow-glass">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Settings className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-black text-text-main">
              Gemini API 키를 먼저 등록해주세요
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              개인 무료 API 키를 등록하면 이 가구의 선택한 기간의 금융 집계를 AI로
              분석할 수 있어요.
            </p>
            <Button
              asChild
              className="mt-6 h-12 cursor-pointer rounded-xl px-6 font-bold"
            >
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                설정에서 키 등록하기
              </Link>
            </Button>
          </section>
        )}
      </div>

      <div className="h-24" />
    </div>
  );
}
