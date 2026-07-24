export type PeriodicReportType = "quarter" | "half" | "year";

export interface ReportDateRange {
  start: string;
  end: string;
}

export interface PeriodRange {
  periodType: PeriodicReportType;
  periodKey: string;
  year: number;
  range: ReportDateRange;
  previousPeriodKey: string;
  previousYear: number;
  previousRange: ReportDateRange;
  periodLabel: string;
  previousPeriodLabel: string;
}

const PERIOD_LABELS: Record<
  PeriodicReportType,
  { periodLabel: string; previousPeriodLabel: string }
> = {
  quarter: {
    periodLabel: "이번 분기",
    previousPeriodLabel: "전분기",
  },
  half: {
    periodLabel: "이번 반기",
    previousPeriodLabel: "전반기",
  },
  year: {
    periodLabel: "올해",
    previousPeriodLabel: "작년",
  },
};

function isValidReportYear(year: number): boolean {
  return Number.isInteger(year) && year >= 2000 && year <= 2100;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getMonthSpanRange(
  year: number,
  startMonth: number,
  monthCount: number,
): ReportDateRange {
  const endMonth = startMonth + monthCount - 1;
  const lastDay = new Date(year, endMonth, 0).getDate();
  return {
    start: formatDate(year, startMonth, 1),
    end: formatDate(year, endMonth, lastDay),
  };
}

function invalidPeriodKey(): never {
  throw new Error("유효하지 않은 보고서 기간입니다.");
}

export function getPeriodRange(
  periodType: PeriodicReportType,
  periodKey: string,
): PeriodRange {
  const labels = PERIOD_LABELS[periodType];

  if (periodType === "quarter") {
    const match = /^(\d{4})-Q([1-4])$/.exec(periodKey);
    if (!match) return invalidPeriodKey();

    const year = Number(match[1]);
    const quarter = Number(match[2]);
    if (!isValidReportYear(year)) return invalidPeriodKey();

    const previousYear = quarter === 1 ? year - 1 : year;
    const previousQuarter = quarter === 1 ? 4 : quarter - 1;

    return {
      periodType,
      periodKey,
      year,
      range: getMonthSpanRange(year, (quarter - 1) * 3 + 1, 3),
      previousPeriodKey: `${previousYear}-Q${previousQuarter}`,
      previousYear,
      previousRange: getMonthSpanRange(
        previousYear,
        (previousQuarter - 1) * 3 + 1,
        3,
      ),
      ...labels,
    };
  }

  if (periodType === "half") {
    const match = /^(\d{4})-H([1-2])$/.exec(periodKey);
    if (!match) return invalidPeriodKey();

    const year = Number(match[1]);
    const half = Number(match[2]);
    if (!isValidReportYear(year)) return invalidPeriodKey();

    const previousYear = half === 1 ? year - 1 : year;
    const previousHalf = half === 1 ? 2 : 1;

    return {
      periodType,
      periodKey,
      year,
      range: getMonthSpanRange(year, half === 1 ? 1 : 7, 6),
      previousPeriodKey: `${previousYear}-H${previousHalf}`,
      previousYear,
      previousRange: getMonthSpanRange(
        previousYear,
        previousHalf === 1 ? 1 : 7,
        6,
      ),
      ...labels,
    };
  }

  const match = /^(\d{4})$/.exec(periodKey);
  if (!match) return invalidPeriodKey();

  const year = Number(match[1]);
  if (!isValidReportYear(year)) return invalidPeriodKey();

  const previousYear = year - 1;
  return {
    periodType,
    periodKey,
    year,
    range: getMonthSpanRange(year, 1, 12),
    previousPeriodKey: String(previousYear),
    previousYear,
    previousRange: getMonthSpanRange(previousYear, 1, 12),
    ...labels,
  };
}
