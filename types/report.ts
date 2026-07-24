export interface ReportStats {
  /** 기존 월간 보고서 JSON에는 없을 수 있어 선택적으로 유지한다. */
  periodLabel?: string;
  /** 기존 월간 보고서 JSON에는 없을 수 있어 선택적으로 유지한다. */
  previousPeriodLabel?: string;
  /**
   * 분기·반기·연간 보고서에서만 채운다. 해당 기간 중 실제 기록이 있는 개월수로,
   * 잔액을 월평균으로 환산하고 "N개월 기록 기준" 캡션을 표시하는 데 쓴다.
   * 월간 보고서는 설정하지 않으며(=undefined) 기존 총액 표시 방식을 유지한다.
   */
  periodMonthsWithData?: number;
  income: number;
  expense: number;
  balance: number;
  fixedExpense: number;
  variableExpense: number;
  irregularExpense: number;
  totalBudget: number;
  budgetUsagePercent: number | null;
  momCategoryDiffs: Array<{
    name: string;
    icon: string;
    current: number;
    prev: number;
    diff: number;
  }>;
  netWorth: number | null;
  netWorthDiff: number | null;
}

export interface ReportAiContent {
  headline: string;
  summaryComment: string;
  momComments: string[];
  budgetFeedback: string;
  savingTips: string[];
  assetComment: string;
  praise: string;
}

export interface MonthlyReportContent {
  stats: ReportStats;
  ai: ReportAiContent;
}
