# 작업 지시서: 월간 AI 가계부 분석 보고서 기능

> **대상**: Codex (또는 이 저장소에서 작업하는 모든 AI 코딩 도구)
> **작성**: 2026-07-15, Claude Code 설계 세션 (설계 배경은 CHANGELOG.md 참고)
> **베이스 규칙**: 저장소 루트 `AGENTS.md` + `D:\workspace\AGENTS.md`를 반드시 먼저 따를 것 — 한글 응답/주석, 서버 액션 입력 검증 필수, React 19 setState-in-effect 금지, 세션 종료 시 `handoff.md`/`CHANGELOG.md` 자동 갱신.

---

## 1. 목표

부부 가계부 앱에 "월간 AI 분석 보고서" 기능을 추가한다.

**확정된 요구사항** (변경 금지):
- **온디맨드 생성**: 크론 없음. 사용자가 버튼을 눌러 생성. 개인 API 키가 등록된 경우에만 가능.
- **AI**: 사용자가 직접 발급한 **Google Gemini 무료 API 키** 사용 (aistudio.google.com). 앱 운영자가 키를 제공하지 않는다. Anthropic 아님.
- **전달**: 인앱 페이지만. 이메일/푸시 없음.
- **새 npm 의존성 0개**: 네이티브 `fetch`로 Gemini REST 호출, 마크다운 렌더러 대신 구조화 JSON → 네이티브 카드 렌더.

## 2. 핵심 설계 결정 (근거 포함 — 임의 변경 금지)

1. **API 키는 가구당 1개** (`household_ai_settings` 테이블). 한 명이 등록하면 부부 둘 다 사용.
   - 평문 저장이지만 이 앱의 신뢰 경계가 이미 "가구"(모든 금융 데이터 공유)이므로 수용.
   - 완화책 (필수 구현): ① 키는 서버 액션/서버 컴포넌트 내부에서만 읽고 클라이언트로 원문 절대 미반환 — 상태 조회는 `{ registered: boolean, maskedKey: "AIza…abcd" }` 형태만, ② 등록 다이얼로그에 "평문 저장됨, 무료 티어 전용 키 권장" 고지 문구, ③ 삭제 액션 제공.
2. **숫자는 앱이 계산, AI는 텍스트만 생성**. 보고서 content는 `{ stats, ai }` 2분할 JSONB.
   - 수치(수입/지출/예산 사용률/전월 대비 증감)는 서버에서 reduce로 계산해 `stats`에 저장.
   - Gemini에는 집계를 입력으로 주되 responseSchema로 **텍스트 필드만** 받는다 → 숫자 환각 차단, 렌더 결정적.
3. **신규 라우트 `/reports/[yearMonth]`** (분석 페이지 내 섹션 아님).
   - 보고서는 "없음→생성 중(10~30초)→있음" 라이프사이클이 별개라 전용 페이지가 깔끔하고, `maxDuration = 60` 세그먼트 설정을 이 라우트에만 국한할 수 있음.
4. **프라이버시**: Gemini 프롬프트에 원시 거래 전체를 보내지 않는다. 카테고리별 집계 + 고액 지출 상위 5건(카테고리/금액/날짜만, **memo 필드 제외**)만 전송.

## 3. 참고할 기존 패턴 파일 (구현 전 반드시 읽을 것)

| 패턴 | 파일 |
|---|---|
| 서버 액션 진입점 (`getHouseholdContext()` 판별 유니온) | `lib/supabase/household-context.ts`, 사용 예 `lib/monthly-budget-actions.ts` |
| 입력 검증 (zod 안 씀 — 자체 유틸) | `lib/validation.ts` (`isValidYearMonth`, `getTrimmedString` 등) |
| 에러 한국어 변환 | `lib/error-messages.ts` (`getKoreanErrorMessage`) |
| useActionState 액션 래퍼 (토스트를 액션 안에서, effect 금지) | `components/settings/feedback-dialog.tsx` |
| yearMonth 라우트 검증 + 월 네비게이션 + 서버 집계 reduce | `app/(app)/transactions/[yearMonth]/analysis/page.tsx` |
| 집계 유틸 재사용 | `lib/calculations/finance.ts` (`calculateSummary`, `groupByCategory`) |
| monthly_balances 6개월 추세 조회 | `app/(app)/page.tsx` (79~149행 부근) |
| RLS 마이그레이션 문구 | `supabase/migrations/20260130000000_add_monthly_budgets.sql` |
| 서버 전용 일반 모듈 ("use server" 아님 — 공개 액션 방지) | `lib/supabase/household-context.ts`, `lib/activity-log.ts` |
| glass-panel 카드 UI | `app/(app)/assets/assets-page-client.tsx` 등 |

월별 거래 조회 RPC `get_transactions_by_month(p_household_id, p_start_date, p_end_date)`는 **마이그레이션 파일에 없고 라이브 DB에만 존재**한다. 반환 타입은 `types/index.ts`의 `TransactionRpcRow`. 기존 호출 패턴(분석 페이지)을 그대로 복사해 쓸 것.

## 4. 구현 단계 (커밋 단위 제안)

### 단계 1: DB 마이그레이션 — `supabase/migrations/20260715000000_ai_reports.sql` (신규)

```sql
-- 1) 가구별 Gemini API 키 (평문 — 가구 신뢰 경계 내 저장, 서버에서만 조회)
CREATE TABLE household_ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL UNIQUE REFERENCES households(id) ON DELETE CASCADE,
  gemini_api_key TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE household_ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage household ai settings" ON household_ai_settings
  FOR ALL USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

-- 2) 월간 보고서
CREATE TABLE monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  content JSONB NOT NULL,          -- { stats: {...}, ai: {...} }
  model TEXT NOT NULL,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(household_id, year, month)
);
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage household monthly reports" ON monthly_reports
  FOR ALL USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));
```

> **🛑 사람 수동 단계 (Codex가 할 수 없음 — 여기서 사용자에게 요청하고 대기할 것)**:
> 이 프로젝트는 CLI 마이그레이션 자동 적용이 안 된다. 위 SQL을 **사용자가 Supabase Dashboard → SQL Editor에서 직접 실행**해야 한다 (운영 프로젝트: `ieahmpxiaamesrnfgbng`). 실행 완료 확인 전에는 단계 3 이후의 런타임 검증이 전부 실패한다. 파일은 기록용으로 repo에 유지한다.

### 단계 2: 타입 + Gemini 서버 모듈

**`types/report.ts` (신규)**:

```ts
export interface ReportStats {           // 앱이 계산 — AI 산출 아님
  income: number; expense: number; balance: number;
  fixedExpense: number; variableExpense: number; irregularExpense: number;
  totalBudget: number; budgetUsagePercent: number | null;   // 예산 미설정 시 null
  momCategoryDiffs: Array<{ name: string; icon: string; current: number; prev: number; diff: number }>; // 증감 상위 5
  netWorth: number | null; netWorthDiff: number | null;     // asset_history 최근 2건
}
export interface ReportAiContent {       // Gemini responseSchema와 1:1
  headline: string;                      // 한줄 총평 (60자 이내)
  summaryComment: string;                // 월간 수치 해설 (200자 이내)
  momComments: string[];                 // momCategoryDiffs 순서 대응 코멘트 (각 80자)
  budgetFeedback: string;
  savingTips: string[];                  // 2~3개
  assetComment: string;                  // 자산 데이터 없으면 ""
  praise: string;                        // 칭찬 포인트
}
export interface MonthlyReportContent { stats: ReportStats; ai: ReportAiContent; }
```

**`lib/ai/gemini.ts` (신규)** — ⚠️ `"use server"` 지시어를 붙이지 말 것 (공개 액션 노출 금지 규칙). `household-context.ts`처럼 서버 전용 일반 모듈로.

- 상수: `const GEMINI_MODEL = "gemini-2.0-flash";` (무료 티어, 1곳에서 교체 가능하게)
- `validateGeminiKey(key: string): Promise<boolean>` — `GET https://generativelanguage.googleapis.com/v1beta/models?key=...` 핑 (토큰 소비 0, 401/400이면 잘못된 키)
- `generateReportContent(key, aggregates): Promise<{ok:true; ai:ReportAiContent} | {ok:false; error:string}>`
  - `POST .../v1beta/models/${GEMINI_MODEL}:generateContent?key=...`
  - body: `system_instruction`(한국어, 부부 가계부 맥락, 따뜻하되 실용적 톤, **제공된 숫자만 언급**, 필드별 길이 제한 지시) + `contents`(집계 JSON 문자열) + `generationConfig: { responseMimeType: "application/json", responseSchema: <ReportAiContent 대응 OBJECT 스키마>, temperature: 0.7 }`
  - `AbortController` + 45초 타임아웃
  - 실패 모드별 한국어 메시지 (이 파일 내 로컬 매핑):
    - 400/403 (API_KEY_INVALID) → `"Gemini API 키가 유효하지 않습니다. 설정에서 키를 다시 확인해주세요."`
    - 429 → `"무료 사용량 한도에 도달했습니다. 잠시 후(약 1분) 다시 시도해주세요."`
    - AbortError → `"AI 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요."`
    - JSON 파싱 실패/필수 키 누락(경량 shape 검증) → `"AI 응답 해석에 실패했습니다. 다시 시도해주세요."`
- 프롬프트 입력(aggregates) 압축 원칙: 카테고리별 지출 합계 상위 8 + 전월 동일 카테고리 금액, expense_type별 합계, 수입 합계, 월 총예산 대비 사용률, monthly_balances 최근 6개월 배열, 고액 지출 상위 5건(카테고리/금액/날짜만 — **memo 금지**), asset_history 최근 2건 total_net_worth(없으면 생략하고 assetComment는 "" 지시).

### 단계 3: 서버 액션 — `lib/report-actions.ts` (신규, `"use server"`)

모든 액션: `getHouseholdContext()` 진입 + 입력 검증 + try/catch + `{ success: true } | { error: string }` 반환.

- `saveGeminiApiKey(prev: ActionState, formData: FormData)` (useActionState 시그니처):
  `getTrimmedString(formData.get("apiKey"), 200)` + 최소 20자 + `/^AIza/` 소프트 체크 → `validateGeminiKey()` 핑 실패 시 저장 거부 → `household_ai_settings` upsert(`onConflict: "household_id"`, `created_by: user.id`) → `revalidatePath("/settings")`
- `deleteGeminiApiKey()`: 해당 가구 로우 delete → revalidatePath
- `generateMonthlyReport(prev: ActionState, formData: FormData)`:
  1. `yearMonth` 파싱 (`/^\d{4}-\d{2}$/` + `isValidYearMonth`) + **미래 월 거부** (현재 월까지 허용)
  2. 키 조회 — 없으면 `"AI 보고서를 사용하려면 설정에서 Gemini API 키를 등록해주세요."`
  3. `Promise.all`: 당월 거래 RPC + 전월 거래 RPC + `monthly_budgets` 당월 + `monthly_balances` 최근 6개월 + `asset_history` 최근 2건(`order record_date desc limit 2`)
  4. 거래 0건 → `"해당 월에 기록된 거래가 없어 보고서를 만들 수 없습니다."`
  5. `ReportStats` 계산 (분석 페이지 reduce 패턴 + `lib/calculations/finance.ts` 재사용)
  6. `generateReportContent()` 호출 → 실패 시 에러 그대로 반환
  7. `monthly_reports` upsert(`onConflict: "household_id,year,month"`, `updated_at: new Date().toISOString()`)
  8. `revalidatePath("/reports/" + yearMonth)` + `revalidatePath("/")` → `{ success: true }`
- 보고서 **조회 액션은 만들지 말 것** — 페이지 서버 컴포넌트에서 직접 쿼리 (공개 액션 최소화).

### 단계 4: 보고서 페이지 + 컴포넌트

- **`app/(app)/reports/[yearMonth]/page.tsx` (신규, 서버 컴포넌트)**:
  - `export const maxDuration = 60;`
  - auth/household 체크 + yearMonth 검증(불량 시 당월로 redirect) — 분석 페이지 앞부분 구조 복사
  - 병렬 조회: `monthly_reports` 해당 월 1건 + `household_ai_settings` 존재 여부(**`select("id")` — 키 컬럼 조회 금지**)
  - 월 네비게이션(분석 페이지 패턴, `/reports/{prev}`·`/reports/{next}`, 미래 월 비활성)
  - 분기: 보고서 있음 → `<ReportView>` + 하단 재생성 버튼(생성일·모델 표기) / 없음+키 있음 → `<GenerateReportCard>` / 없음+키 없음 → 안내 카드 + `/settings` 링크
- **`components/reports/report-view.tsx` (신규)**: 순수 프리젠테이션. ① headline 히어로(glass-panel + Sparkles 아이콘) ② stats 요약 그리드(수입/지출/잔액/예산 사용률) ③ 전월 대비 하이라이트(momCategoryDiffs+momComments 짝, 증감 화살표·색) ④ 예산 피드백 ⑤ 절약 팁 리스트 ⑥ 자산 코멘트(있을 때만) ⑦ 칭찬 카드. content shape 방어(필수 키 누락 시 해당 섹션 스킵).
- **`components/reports/generate-report-card.tsx` (신규, "use client")**: feedback-dialog.tsx의 useActionState 래퍼 패턴 그대로 — 토스트는 액션 래퍼 내부에서, effect 사용 금지. pending 시 `Loader2` 스핀 + "AI가 한 달 가계부를 분석하고 있어요… (최대 30초)" + 버튼 disabled.

### 단계 5: 설정 진입점

- **`components/settings/ai-settings-dialog.tsx` (신규)**: 미등록 시 키 입력 폼(aistudio.google.com 발급 안내 링크 + 평문 저장 고지) → `saveGeminiApiKey` / 등록 시 마스킹 키 표시(`"AIza…" + 마지막 4자` — **서버에서 계산해 prop으로**, 원문 미전달) + 삭제 버튼 + "이번 달 보고서 보러가기" 링크.
- **`app/(app)/settings/page.tsx` 수정**: ai_settings 존재 여부 + 마스킹 문자열 서버 조회 → prop 전달. 메뉴 그리드에 "AI 월간 보고서" 항목(`/reports/{지난달}` 링크) 추가, 키 관리 다이얼로그 버튼은 Support 섹션 하단에.

### 단계 6 (선택): 대시보드 티저

- `components/dashboard/report-teaser-card.tsx` + `app/(app)/page.tsx`의 Promise.all에 지난달 `monthly_reports` `select("id")` 추가 → 존재 시에만 "지난달 AI 보고서가 도착했어요" 링크 카드 (미존재 시 아무것도 노출 안 함).

## 5. 검증 체크리스트

1. [ ] `npx tsc --noEmit` 통과
2. [ ] `npx eslint .` 0 오류 0 경고
3. [ ] `npm run build` 성공
4. [ ] **(사람) Supabase Dashboard SQL Editor에서 단계 1 SQL 실행 완료** ← 이후 항목의 선행 조건
5. [ ] Playwright (dev 서버 = 라이브 DB): 키 미등록 상태 `/reports/{당월}` → 안내 카드 + 설정 링크
6. [ ] 잘못된 키(`AIzaINVALID...`) 입력 → 핑 실패 토스트, DB 미저장 확인
7. [ ] 정상 키(사용자 제공 필요) → 마스킹 표시 → 생성 버튼 → 로딩 → 보고서 섹션 렌더 → 재생성 동작
8. [ ] 거래 0건 월 → 에러 토스트 / 미래 월 → 검증 에러
9. [ ] 브라우저 네트워크 탭에서 키 원문이 클라이언트로 내려오지 않는지 확인
10. [ ] 완료 후 `handoff.md`·`CHANGELOG.md` 갱신, 커밋 메시지는 한글 conventional 형식

## 6. 리스크 메모

- Gemini 무료 티어 분당 요청 제한(429): 버튼 pending 비활성화 1차 방어 + 한국어 안내 2차.
- Vercel 함수 타임아웃: `maxDuration=60` + fetch 45초 abort 이중 방어. (Hobby 플랜 60초 가능 여부는 배포 후 실측 확인)
- 정상 키 E2E는 사용자의 실제 Gemini 키 필요 — 없으면 잘못된 키 경로까지 검증하고 사용자에게 안내.
- `get_transactions_by_month` RPC는 라이브 DB에만 존재 — 기존 호출 패턴만 재사용하므로 신규 리스크 없음. 시그니처를 바꾸지 말 것.
