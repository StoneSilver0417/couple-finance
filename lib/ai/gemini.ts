import "server-only";

import type { ReportAiContent } from "@/types/report";

export const GEMINI_MODEL = "gemini-2.0-flash-lite";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GENERATION_TIMEOUT_MS = 45_000;

export interface GeminiReportAggregates {
  /** 기존 월간 생성 경로는 생략하며 Gemini 요청 시 월간 라벨을 기본값으로 사용한다. */
  periodLabel?: string;
  /** 기존 월간 생성 경로는 생략하며 Gemini 요청 시 월간 라벨을 기본값으로 사용한다. */
  previousPeriodLabel?: string;
  /**
   * 직전 기간에 비교할 지출 기록이 있었는지 여부. false면 이전 기간 데이터가 없어
   * "전월/전분기 대비" 같은 비교 서술이 불가능하다(가입 초기 등). 생략 시 true로 본다.
   */
  hasComparisonBaseline?: boolean;
  yearMonth: string;
  categoryExpenses: Array<{
    name: string;
    icon: string;
    current: number;
    previous: number;
  }>;
  monthOverMonthHighlights: Array<{
    name: string;
    current: number;
    previous: number;
    diff: number;
  }>;
  expenseTypeTotals: {
    fixed: number;
    variable: number;
    irregular: number;
  };
  income: number;
  totalBudget: number;
  budgetUsagePercent: number | null;
  monthlyTrend: Array<{
    year: number;
    month: number;
    income: number;
    expense: number;
  }>;
  highExpenses: Array<{
    category: string;
    amount: number;
    date: string;
  }>;
  assets?: {
    current: number;
    previous: number | null;
    diff: number | null;
  };
}

function createReportResponseSchema(
  periodLabel: string,
  previousPeriodLabel: string,
) {
  return {
    type: "OBJECT",
    properties: {
      headline: {
        type: "STRING",
        description: `${periodLabel} 가계부 한 줄 총평. 한국어 60자 이내.`,
      },
      summaryComment: {
        type: "STRING",
        description: `${periodLabel} 수입과 지출에 대한 실용적인 한국어 해설. 200자 이내.`,
      },
      momComments: {
        type: "ARRAY",
        description: `monthOverMonthHighlights와 같은 순서와 개수의 ${previousPeriodLabel} 대비 코멘트. 각 항목 한국어 80자 이내.`,
        items: { type: "STRING" },
      },
      budgetFeedback: {
        type: "STRING",
        description: `${periodLabel} 예산 사용에 대한 한국어 피드백. 160자 이내.`,
      },
      savingTips: {
        type: "ARRAY",
        description: "집계에 근거한 구체적인 한국어 절약 팁 2~3개.",
        items: { type: "STRING" },
      },
      assetComment: {
        type: "STRING",
        description:
          "자산 집계가 있을 때만 작성하는 한국어 코멘트. 자산 집계가 없으면 빈 문자열.",
      },
      praise: {
        type: "STRING",
        description: "집계에서 찾은 긍정적인 습관을 칭찬하는 한국어 문장.",
      },
    },
    required: [
      "headline",
      "summaryComment",
      "momComments",
      "budgetFeedback",
      "savingTips",
      "assetComment",
      "praise",
    ],
  } as const;
}

function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

function isBoundedStringArray(
  value: unknown,
  maxItems: number,
  maxItemLength: number,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every((item) => isBoundedString(item, maxItemLength))
  );
}

function isReportAiContent(
  value: unknown,
  expectedMomCommentCount: number,
): value is ReportAiContent {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    isBoundedString(candidate.headline, 60) &&
    isBoundedString(candidate.summaryComment, 200) &&
    isBoundedStringArray(candidate.momComments, 5, 80) &&
    candidate.momComments.length === expectedMomCommentCount &&
    isBoundedString(candidate.budgetFeedback, 300) &&
    isBoundedStringArray(candidate.savingTips, 3, 300) &&
    candidate.savingTips.length >= 2 &&
    isBoundedString(candidate.assetComment, 300) &&
    isBoundedString(candidate.praise, 300)
  );
}

function extractResponseText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  const firstCandidate = candidates[0];
  if (!firstCandidate || typeof firstCandidate !== "object") return null;
  const content = (firstCandidate as { content?: unknown }).content;
  if (!content || typeof content !== "object") return null;
  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts) || parts.length === 0) return null;

  const textPart = parts.find(
    (part): part is { text: string } =>
      Boolean(
        part &&
          typeof part === "object" &&
          typeof (part as { text?: unknown }).text === "string",
      ),
  );
  return textPart?.text ?? null;
}

function extractGeminiErrorDetail(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== "object") return null;

  const message = (error as { message?: unknown }).message;
  const details = (error as { details?: unknown }).details;
  if (!Array.isArray(details)) {
    return typeof message === "string" ? message : null;
  }

  const quotaFailures = details
    .flatMap((detail) => {
      if (!detail || typeof detail !== "object") return [];
      const violations = (detail as { violations?: unknown }).violations;
      if (!Array.isArray(violations)) return [];
      return violations
        .map((violation) => {
          if (!violation || typeof violation !== "object") return null;
          const subject = (violation as { subject?: unknown }).subject;
          const description = (violation as { description?: unknown }).description;
          return [description, subject].filter(Boolean).join(" / ");
        })
        .filter((item): item is string => Boolean(item));
    })
    .slice(0, 2);

  if (quotaFailures.length > 0) return quotaFailures.join(", ");
  return typeof message === "string" ? message : null;
}

function getGeminiErrorMessage(status: number, detail: string | null): string {
  if (status === 400 || status === 401 || status === 403) {
    return "Gemini API 키가 유효하지 않습니다. 설정에서 키를 다시 확인해주세요.";
  }
  if (status === 429) {
    return detail
      ? `Gemini 한도에 걸렸습니다: ${detail}`
      : "Gemini 무료 사용량 한도에 도달했습니다. 잠시 후 다시 시도하거나, AI Studio에서 해당 프로젝트의 한도를 확인해주세요.";
  }
  return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
}

export async function validateGeminiKey(key: string): Promise<boolean> {
  try {
    const response = await fetch(`${GEMINI_API_BASE}/models`, {
      method: "GET",
      headers: { "x-goog-api-key": key },
      cache: "no-store",
    });
    return response.ok;
  } catch (error) {
    console.error("Gemini API 키 검증 요청 실패:", error);
    return false;
  }
}

export async function generateReportContent(
  key: string,
  aggregates: GeminiReportAggregates,
): Promise<
  { ok: true; ai: ReportAiContent } | { ok: false; error: string }
> {
  const periodLabel = aggregates.periodLabel ?? "이번 달";
  const previousPeriodLabel = aggregates.previousPeriodLabel ?? "전월";
  // 직전 기간에 비교할 지출 기록이 없으면(가입 초기 등) 비교 서술 자체가 불가능하다.
  const hasComparisonBaseline =
    aggregates.hasComparisonBaseline ??
    aggregates.monthOverMonthHighlights.length > 0;
  const comparisonInstruction = hasComparisonBaseline
    ? `monthOverMonthHighlights의 순서를 유지해 ${previousPeriodLabel} 대비 momComments를 같은 개수로 작성하세요.`
    : `${previousPeriodLabel}에는 비교할 지출 기록이 없습니다. "${previousPeriodLabel} 대비" 같은 비교 표현은 절대 쓰지 말고, ${periodLabel} 지출 구성과 규모 자체를 설명하세요. momComments는 반드시 빈 배열로 두세요.`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: [
                  `당신은 부부 공동 가계부의 전문 재무 컨설턴트입니다. ${periodLabel} 금융 흐름과 지출 패턴을 깊이 있게 분석합니다.`,
                  "단순한 수치 나열을 넘어, 고정비와 변동비의 비율, 지출 누수(Leak) 포인트, 그리고 일상에서 바로 실천할 수 있는 구체적이고 현실적인 절약 액션 플랜을 제안하세요.",
                  "따뜻한 공감을 바탕으로 하되, 재정 건전성을 위한 뼈 있는 조언과 칭찬을 아끼지 마세요.",
                  "반드시 제공된 집계의 숫자만 언급하고 새로운 금액이나 비율을 임의로 계산하거나 추측하지 마세요.",
                  comparisonInstruction,
                  "savingTips는 고정비/변동비 절감에 도움되는 실용적인 조언 2~3개로 작성하세요.",
                  "assets가 제공되지 않았다면 assetComment는 반드시 빈 문자열로 작성하세요.",
                  "headline은 60자, summaryComment는 200자, momComments 각 항목은 80자 이내로 작성하세요.",
                ].join("\n"),
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `다음 집계만 근거로 ${periodLabel} 보고서 문구를 작성하세요.\n${JSON.stringify(aggregates)}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: createReportResponseSchema(
              periodLabel,
              previousPeriodLabel,
            ),
            temperature: 0.7,
          },
        }),
      },
    );

    if (!response.ok) {
      let errorPayload: unknown = null;
      try {
        errorPayload = await response.json();
      } catch {
        errorPayload = null;
      }
      const detail = extractGeminiErrorDetail(errorPayload);
      console.error("Gemini 보고서 생성 응답 오류:", {
        status: response.status,
        detail,
      });
      return {
        ok: false,
        error: getGeminiErrorMessage(response.status, detail),
      };
    }

    const responsePayload: unknown = await response.json();
    const responseText = extractResponseText(responsePayload);
    if (!responseText) {
      return {
        ok: false,
        error: "AI 응답 해석에 실패했습니다. 다시 시도해주세요.",
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return {
        ok: false,
        error: "AI 응답 해석에 실패했습니다. 다시 시도해주세요.",
      };
    }

    if (
      !isReportAiContent(parsed, aggregates.monthOverMonthHighlights.length)
    ) {
      return {
        ok: false,
        error: "AI 응답 해석에 실패했습니다. 다시 시도해주세요.",
      };
    }

    return { ok: true, ai: parsed };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        error: "AI 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
      };
    }
    console.error("Gemini AI 보고서 생성 실패:", error);
    return {
      ok: false,
      error: "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
