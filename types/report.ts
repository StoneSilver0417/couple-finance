export interface ReportStats {
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
