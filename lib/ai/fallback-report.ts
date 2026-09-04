import type { ReportAiContent, ReportStats } from "@/types/report";
import type { GeminiReportAggregates } from "@/lib/ai/gemini";

/**
 * 재무 컨설턴트 수준의 보고서 내용을 생성하기 위한 강화된 로직.
 * 실제 AI 모델이 없거나 실패할 경우 사용됨.
 */
export function createEnhancedFallbackReport(
  stats: ReportStats,
  aggregates: GeminiReportAggregates,
): ReportAiContent {
  const isMonthlyReport = !stats.periodLabel && !aggregates.periodLabel;
  const periodLabel = stats.periodLabel ?? aggregates.periodLabel ?? "이번 달";
  const previousPeriodLabel =
    stats.previousPeriodLabel ?? aggregates.previousPeriodLabel ?? "전월";
  const nextPeriodLabel = isMonthlyReport ? "다음 달" : "다음 기간";

  const biggestExpense = aggregates.categoryExpenses[0];

  // 1. 헤드라인: 컨설턴트 톤앤매너 강화
  const headline = biggestExpense
    ? `[진단] ${biggestExpense.name} 지출이 이번 기간의 핵심 리스크입니다. 지금 바로 재검토가 필요합니다.`
    : `[브리핑] ${periodLabel} 금융 흐름과 지출 효율성을 심층 분석한 결과입니다.`;

  // 2. 누수 진단 로직 추가 (지출 패턴 분석)
  const leakDiagnosis = biggestExpense && biggestExpense.current > (stats.expense * 0.3)
    ? `⚠️ 지출 누수 경고: ${biggestExpense.name} 지출이 총지출의 30%를 초과했습니다. 꼭 필요한 소비인지, 단순 과소비인지 세부 내역을 파악하여 지출 한도를 즉시 조정하십시오.`
    : `🔍 지출 누수 진단: 특이 지출 패턴은 발견되지 않았으나, 변동비 중 불필요한 결제 항목이 있는지 꼼꼼히 체크하면 추가 절약이 가능합니다.`;

  // 3. 고정비/변동비 분석
  const fixedRatio = stats.expense > 0 ? (stats.fixedExpense / stats.expense) * 100 : 0;
  const fixedVariableAnalysis = `📊 고정비(${stats.fixedExpense.toLocaleString()}원)와 변동비(${stats.variableExpense.toLocaleString()}원) 구성 분석: 고정비 비율이 ${fixedRatio.toFixed(1)}%입니다. 고정비가 50%를 상회한다면, 정기 결제 내역을 재정비하여 고정지출 다이어트를 단행해야 합니다.`;

  // 4. 나머지 데이터 구성
  const momComments = aggregates.monthOverMonthHighlights.map((category) => {
    const diffText = category.diff > 0 ? "증가" : "감소";
    return `📈 ${category.name} 지출이 ${previousPeriodLabel} 대비 ${Math.abs(category.diff).toLocaleString()}원 ${diffText}하였습니다.`;
  });

  return {
    headline,
    summaryComment: `${periodLabel} 총 수입 ${stats.income.toLocaleString()}원 대비 총 지출 ${stats.expense.toLocaleString()}원을 기록하였습니다. 가계부 건전성 향상을 위한 전문적인 분석을 확인하세요.`,
    momComments,
    budgetFeedback:
      stats.totalBudget > 0
        ? `🎯 예산 관리 효율: 예산 대비 ${(stats.budgetUsagePercent ?? 0).toFixed(1)}% 소진. ${(stats.budgetUsagePercent ?? 0) > 90 ? "예산 초과 위험이 있으므로 즉시 지출을 통제하십시오." : "예산 범위 내에서 안정적인 운영이 이루어지고 있습니다."}`
        : "💡 예산 설정 권장: 체계적인 자산 형성을 위해 월별 예산을 설정하십시오.",
    fixedVariableAnalysis,
    leakDiagnosis,
    savingTips: [
      "🔥 절약 전략 1: 고정지출 중 구독 서비스 및 보험료를 일괄 해지/조정하십시오.",
      "🚀 절약 전략 2: 지출이 가장 큰 카테고리부터 주간 지출 상한선을 설정하고 준수하십시오.",
      "✨ 절약 전략 3: 잔여 예산은 즉시 저축계좌로 이체하여 '먼저 저축하고 남은 것으로 소비'하는 습관을 들이십시오.",
    ],
    assetComment: stats.netWorth !== null ? `💎 순자산 브리핑: 현재 순자산 ${stats.netWorth.toLocaleString()}원. 전기간 대비 증감 추이를 점검하며 자산 체력을 높여가야 합니다.` : "💎 순자산 브리핑: 자산 정보를 연동하여 순자산 흐름을 관리하세요.",
    praise: stats.balance >= 0
      ? `🏆 컨설턴트 총평: 흑자 구조를 유지하신 점을 높이 평가합니다. 이 습관을 ${nextPeriodLabel}에도 유지하여 자산 증식을 가속화하세요!`
      : `⚡ 컨설턴트 총평: 적자 구조의 원인을 파악하는 것이 변화의 시작입니다. 이번 달 지출 내역을 철저히 분석하여 ${nextPeriodLabel}에는 반드시 흑자 전환을 달성합시다.`,
  };
}
