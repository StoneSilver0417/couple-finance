import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CircleDollarSign,
  Gauge,
  Lightbulb,
  PiggyBank,
  Sparkles,
  Tags,
} from "lucide-react";

interface SafeCategoryDiff {
  name: string;
  current: number;
  prev: number;
  diff: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getString(record: Record<string, unknown>, key: string): string {
  return typeof record[key] === "string" ? record[key] : "";
}

function getStringArray(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function getCategoryDiffs(record: Record<string, unknown>): SafeCategoryDiff[] {
  const value = record.momCategoryDiffs;
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const name = getString(item, "name");
    const current = getNumber(item, "current");
    const prev = getNumber(item, "prev");
    const diff = getNumber(item, "diff");
    if (!name || current === null || prev === null || diff === null) return [];
    return [{ name, current, prev, diff }];
  });
}

function formatWon(value: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  valueTone = "text-slate-950",
  cardTone = "border-slate-100 bg-white/90",
}: {
  label: string;
  value: string;
  icon: typeof BanknoteArrowDown;
  tone: string;
  valueTone?: string;
  cardTone?: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${cardTone}`}>
      <div className="mb-2.5 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-sm font-extrabold text-slate-600">{label}</span>
      </div>
      <p
        className={`break-words text-[1.125rem] font-black leading-tight tracking-tight ${valueTone}`}
      >
        {value}
      </p>
    </div>
  );
}

export function ReportView({ content }: { content: unknown }) {
  if (!isRecord(content)) return null;
  const stats = isRecord(content.stats) ? content.stats : {};
  const ai = isRecord(content.ai) ? content.ai : {};

  const headline = getString(ai, "headline");
  const summaryComment = getString(ai, "summaryComment");
  const budgetFeedback = getString(ai, "budgetFeedback");
  const assetComment = getString(ai, "assetComment");
  const praise = getString(ai, "praise");
  const momComments = getStringArray(ai, "momComments");
  const savingTips = getStringArray(ai, "savingTips");
  const categoryDiffs = getCategoryDiffs(stats);

  const income = getNumber(stats, "income");
  const expense = getNumber(stats, "expense");
  const balance = getNumber(stats, "balance");
  const budgetUsagePercent = getNumber(stats, "budgetUsagePercent");
  const netWorth = getNumber(stats, "netWorth");
  const netWorthDiff = getNumber(stats, "netWorthDiff");

  const statItems = [
    income !== null
      ? {
          label: "수입",
          value: formatWon(income),
          icon: BanknoteArrowDown,
          tone: "bg-emerald-50 text-emerald-600",
          valueTone: "text-emerald-700",
          cardTone: "border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white",
        }
      : null,
    expense !== null
      ? {
          label: "지출",
          value: formatWon(expense),
          icon: BanknoteArrowUp,
          tone: "bg-rose-50 text-rose-600",
          valueTone: "text-rose-700",
          cardTone: "border-rose-100 bg-gradient-to-br from-rose-50/80 to-white",
        }
      : null,
    balance !== null
      ? {
          label: "잔액",
          value: formatWon(balance),
          icon: CircleDollarSign,
          tone: "bg-blue-50 text-blue-600",
        }
      : null,
    budgetUsagePercent !== null
      ? {
          label: "예산 사용률",
          value: `${budgetUsagePercent.toFixed(1)}%`,
          icon: Gauge,
          tone: "bg-violet-50 text-violet-600",
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="space-y-6">
      {headline && (
        <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white/95 p-5 shadow-soft">
          <div className="relative space-y-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-dark to-primary text-white shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="mb-2 text-[0.72rem] font-black uppercase tracking-widest text-primary-dark">
                AI Monthly Insight
              </p>
              <h2 className="text-[1.35rem] font-black leading-[1.28] tracking-tight text-slate-950">
                {headline}
              </h2>
              {summaryComment && (
                <p className="mt-4 text-base leading-7 text-slate-700">
                  {summaryComment}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {statItems.length > 0 && (
        <section aria-labelledby="report-summary-title">
          <h3
            id="report-summary-title"
            className="mb-3 px-1 text-xl font-black tracking-tight text-slate-950"
          >
            이번 달 요약
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {statItems.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </div>
        </section>
      )}

      {categoryDiffs.length > 0 && (
        <section className="rounded-[1.75rem] border border-slate-100 bg-white/95 p-5 shadow-sm">
          <h3 className="mb-5 flex items-center gap-2 text-xl font-black tracking-tight text-slate-950">
            <Tags className="h-5 w-5 text-violet-500" aria-hidden="true" />
            전월 대비 주요 변화
          </h3>
          <div className="space-y-4">
            {categoryDiffs.map((category, index) => {
              const increased = category.diff > 0;
              return (
                <div
                  key={category.name}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-base font-black text-slate-950">
                        {category.name}
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-slate-600">
                        전월 {formatWon(category.prev)} → 이번 달 {formatWon(category.current)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-black ${
                        increased
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {increased ? (
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {increased ? "증가" : "감소"} {formatWon(Math.abs(category.diff))}
                    </span>
                  </div>
                  {momComments[index] && (
                    <p className="mt-4 border-t border-slate-200 pt-3 text-[15px] leading-7 text-slate-700">
                      {momComments[index]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {budgetFeedback && (
        <section className="rounded-[1.75rem] border border-blue-100 bg-blue-50/90 p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-black text-blue-950">
            <Gauge className="h-5 w-5" aria-hidden="true" /> 예산 피드백
          </h3>
          <p className="text-base leading-7 text-blue-900">{budgetFeedback}</p>
        </section>
      )}

      {savingTips.length > 0 && (
        <section className="rounded-[1.75rem] border border-slate-100 bg-white/95 p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-black tracking-tight text-slate-950">
            <Lightbulb className="h-5 w-5 text-amber-500" aria-hidden="true" />
            다음 달 절약 팁
          </h3>
          <ol className="space-y-3">
            {savingTips.map((tip, index) => (
              <li key={`${index}-${tip}`} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-black text-amber-800">
                  {index + 1}
                </span>
                <p className="pt-0.5 text-base leading-7 text-slate-700">
                  {tip}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {assetComment && netWorth !== null && (
        <section className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/90 p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="flex items-center gap-2 font-black text-emerald-900">
              <PiggyBank className="h-5 w-5" aria-hidden="true" /> 자산 코멘트
            </h3>
            {netWorthDiff !== null && (
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-emerald-900">
                최근 기록 대비 {netWorthDiff >= 0 ? "+" : ""}
                {formatWon(netWorthDiff)}
              </span>
            )}
          </div>
          <p className="text-base leading-7 text-emerald-900">{assetComment}</p>
        </section>
      )}

      {praise && (
        <section className="rounded-[1.75rem] border border-primary/20 bg-white/95 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/75 text-primary-dark shadow-sm">
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-lg font-black text-slate-950">이번 달 잘한 점</h3>
              <p className="mt-2 text-base leading-7 text-slate-700">
                {praise}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
