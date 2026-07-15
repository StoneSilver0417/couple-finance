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
}: {
  label: string;
  value: string;
  icon: typeof BanknoteArrowDown;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/65 p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-xs font-bold text-text-secondary">{label}</span>
      </div>
      <p className="break-words text-lg font-black tracking-tight text-text-main">
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
        }
      : null,
    expense !== null
      ? {
          label: "지출",
          value: formatWon(expense),
          icon: BanknoteArrowUp,
          tone: "bg-rose-50 text-rose-600",
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
    <div className="space-y-5">
      {headline && (
        <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/70 p-6 shadow-glass">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-dark to-primary text-white shadow-lg shadow-primary/20">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-widest text-primary-dark">
                AI Monthly Insight
              </p>
              <h2 className="text-xl font-black leading-snug text-text-main">
                {headline}
              </h2>
              {summaryComment && (
                <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
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
            className="mb-3 px-1 text-lg font-black text-text-main"
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
        <section className="glass-panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-text-main">
            <Tags className="h-5 w-5 text-violet-500" aria-hidden="true" />
            전월 대비 주요 변화
          </h3>
          <div className="space-y-3">
            {categoryDiffs.map((category, index) => {
              const increased = category.diff > 0;
              return (
                <div
                  key={category.name}
                  className="rounded-2xl border border-white/80 bg-white/55 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-text-main">
                        {category.name}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">
                        전월 {formatWon(category.prev)} → 이번 달 {formatWon(category.current)}
                      </p>
                    </div>
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${
                        increased
                          ? "bg-rose-50 text-rose-700"
                          : "bg-emerald-50 text-emerald-700"
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
                    <p className="mt-3 border-t border-black/5 pt-3 text-sm leading-relaxed text-text-secondary">
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
        <section className="rounded-[2rem] border border-blue-100 bg-blue-50/80 p-5 shadow-sm">
          <h3 className="mb-2 flex items-center gap-2 font-black text-blue-900">
            <Gauge className="h-5 w-5" aria-hidden="true" /> 예산 피드백
          </h3>
          <p className="text-[15px] leading-relaxed text-blue-800">{budgetFeedback}</p>
        </section>
      )}

      {savingTips.length > 0 && (
        <section className="glass-panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-text-main">
            <Lightbulb className="h-5 w-5 text-amber-500" aria-hidden="true" />
            다음 달 절약 팁
          </h3>
          <ol className="space-y-3">
            {savingTips.map((tip, index) => (
              <li key={`${index}-${tip}`} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-black text-amber-800">
                  {index + 1}
                </span>
                <p className="pt-0.5 text-[15px] leading-relaxed text-text-secondary">
                  {tip}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {assetComment && netWorth !== null && (
        <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50/75 p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="flex items-center gap-2 font-black text-emerald-900">
              <PiggyBank className="h-5 w-5" aria-hidden="true" /> 자산 코멘트
            </h3>
            {netWorthDiff !== null && (
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-emerald-800">
                최근 기록 대비 {netWorthDiff >= 0 ? "+" : ""}
                {formatWon(netWorthDiff)}
              </span>
            )}
          </div>
          <p className="text-[15px] leading-relaxed text-emerald-800">{assetComment}</p>
        </section>
      )}

      {praise && (
        <section className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 to-accent-peach/25 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/75 text-primary-dark shadow-sm">
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-black text-text-main">이번 달 잘한 점</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-text-secondary">
                {praise}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
