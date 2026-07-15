import "server-only";

import type { ReportAiContent } from "@/types/report";

export const GEMINI_MODEL = "gemini-2.0-flash";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GENERATION_TIMEOUT_MS = 45_000;

export interface GeminiReportAggregates {
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

const reportResponseSchema = {
  type: "OBJECT",
  properties: {
    headline: {
      type: "STRING",
      description: "이번 달 가계부 한 줄 총평. 한국어 60자 이내.",
    },
    summaryComment: {
      type: "STRING",
      description: "월간 수입과 지출에 대한 실용적인 한국어 해설. 200자 이내.",
    },
    momComments: {
      type: "ARRAY",
      description:
        "categoryExpenses와 같은 순서의 전월 대비 코멘트. 각 항목 한국어 80자 이내.",
      items: { type: "STRING" },
    },
    budgetFeedback: {
      type: "STRING",
      description: "예산 사용에 대한 한국어 피드백. 160자 이내.",
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

function getGeminiErrorMessage(status: number): string {
  if (status === 400 || status === 401 || status === 403) {
    return "Gemini API 키가 유효하지 않습니다. 설정에서 키를 다시 확인해주세요.";
  }
  if (status === 429) {
    return "무료 사용량 한도에 도달했습니다. 잠시 후(약 1분) 다시 시도해주세요.";
  }
  return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
}

export async function validateGeminiKey(key: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/models?key=${encodeURIComponent(key)}`,
      { method: "GET", cache: "no-store" },
    );
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: [
                  "당신은 부부가 함께 쓰는 가계부의 월간 분석 도우미입니다.",
                  "따뜻하지만 과장하지 않고, 바로 실천할 수 있는 한국어 조언을 작성하세요.",
                  "반드시 제공된 집계의 숫자만 언급하고 새로운 금액이나 비율을 계산하거나 추측하지 마세요.",
                  "monthOverMonthHighlights의 순서를 유지해 momComments를 하나씩 작성하세요.",
                  "savingTips는 2~3개만 작성하세요.",
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
                  text: `다음 집계만 근거로 월간 보고서 문구를 작성하세요.\n${JSON.stringify(aggregates)}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: reportResponseSchema,
            temperature: 0.7,
          },
        }),
      },
    );

    if (!response.ok) {
      return { ok: false, error: getGeminiErrorMessage(response.status) };
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
    console.error("Gemini 월간 보고서 생성 실패:", error);
    return {
      ok: false,
      error: "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
