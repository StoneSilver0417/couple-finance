# Changelog

## 2026-07-24

### feat - AI 보고서 분기·반기·연간 확장 Phase 2 구현

- 확정 설계대로 기존 라이브 `monthly_reports`는 전혀 수정하지 않고 분기·반기·연간 전용 `periodic_reports` 테이블과 가구 RLS 정책을 정의한 `20260724000000_periodic_reports.sql`을 추가했다. 운영 Supabase에는 실행하지 않았으며 사용자가 Dashboard SQL Editor에서 수동 적용해야 한다.
- `lib/period-range.ts`를 신설해 분기·반기·연간의 당기간/전기간 날짜 범위와 `periodLabel`/`previousPeriodLabel`을 계산한다. Q1→전년 Q4, H1→전년 H2, 연간→전년 경계를 포함한 14개 유효·거부 시나리오를 Node로 검증했다.
- `generatePeriodicReport` 서버 액션을 기존 `generateMonthlyReport` 옆에 새로 추가했다. 유형별 정규식·연도 검증, 미래 기간 차단, 당기간/전기간 거래 비교, 기간 내 월 예산 합산, 변동지출 기준 예산 사용률, 월별 추이 3/6/12개월, 상세 상위 8/10/12개, 자산 기록 및 `periodic_reports` upsert를 구현했다. 기존 월간 액션 함수 본문은 HEAD와 동일함을 별도 비교했다.
- 보고서 라우트를 `/reports/[yearMonth]`에서 `/reports/[period]`로 일반화했다. 파싱 순서를 월→분기→반기→연간으로 고정하고 월간일 때만 기존 `monthly_reports`/`GenerateReportCard`/`generateMonthlyReport` 경로를 사용한다. 오늘 기준 기간으로 이동하는 월·분기·반기·연간 탭, 유형별 이전/다음 이동과 미래·2000년 하한 방어, 44px 터치 영역·고대비 포커스/활성 상태를 추가했다.
- 기존 JSON 키 `momCategoryDiffs`, `monthOverMonthHighlights`, `momComments`, `monthlyTrend`, `yearMonth`는 모두 유지하고 선택적 라벨 필드만 추가했다. `ReportView`는 기본 월간 문구를 그대로 보존하면서 비월간 화면의 요약·직전 기간 비교·칭찬 문구를 동적으로 표시한다.
- Gemini 응답 스키마 설명과 시스템/사용자 프롬프트를 기간 라벨 기반으로 바꾸고, `momComments` 기준을 실제 런타임 검증과 같은 `monthOverMonthHighlights` 순서·개수로 바로잡았다. Gemini 실패 시 로컬 fallback도 기간별 문구를 사용하되 기존 월간 fallback 결과는 유지한다.
- 검증 중 Next 16이 기존 페이지 3곳의 동기 `params/searchParams` 타입을 거부해 이미 `await`하던 선언만 `Promise`로 교정했다. `npx tsc --noEmit`, `npx eslint .`, 폰트 mock을 사용한 `npx next build --webpack` 전체 프로덕션 빌드와 `/reports/2026-07`, 현재 분기·반기·연간, 잘못된 값, 미래 분기 서버 리다이렉트를 통과했다. 기본 `npm run build`는 코드와 무관하게 샌드박스의 Google Fonts(Manrope/Nunito) 네트워크 차단으로 두 차례 실패했다. 운영 DB 미적용 원칙 때문에 신규 기간 생성·재생성 실데이터 E2E는 마이그레이션 수동 적용 후 진행한다.
- **검토·수정 (Claude Code)**: Codex가 `generatePeriodicReport`의 입력 검증에 zod를 쓰면서 "새 npm 의존성 추가 금지" 제약을 우회하려고 Next.js 내부 번들 경로(`next/dist/compiled/zod`)를 직접 import하고 이를 위한 가짜 타입 선언 파일(`types/next-compiled-zod.d.ts`)까지 만들었다. 이 저장소의 다른 서버 액션 14개는 전부 zod 없이 수동 검증(정규식·타입가드)만 쓰고 있고, `next/dist/compiled/*`는 Next.js가 공개하지 않는 내부 구현 경로라 버전업 때 아무 경고 없이 사라질 수 있어 위험하다고 판단, `parsePeriodicReportInput()`(정규식 + `isValidYearMonth` 재사용)으로 교체하고 가짜 타입 선언 파일을 삭제했다. 네트워크 제한 없는 로컬 환경에서 `npx tsc --noEmit`, `npx eslint .`, `npm run build`(Turbopack, 폰트 mock 불필요) 모두 재통과 확인.

### fix - 도넛 차트 퍼센트 라벨 두 번 클릭 버그 수정 (Codex 진단)

- 사용자가 도넛 차트(`components/charts/asset-portfolio-chart.tsx`의 `AssetPortfolioChart`, 자산 페이지·연간 요약 페이지 공용)에서 조각의 퍼센트(%) 텍스트를 클릭하면 첫 클릭이 반응하지 않고 두 번 클릭해야 선택된다고 지적, 명시적으로 Codex 플러그인(`codex:rescue`)에 위임해 진단·수정을 요청했다.
- Codex가 원인을 확인: `<Pie>`의 `label` prop으로 렌더링되는 퍼센트 `<text>` 엘리먼트가 조각(`Cell`/`Sector`) 위에 겹쳐 그려지지만 `pointer-events`가 지정돼 있지 않아, 라벨 글자 정확히 위를 클릭하면 클릭이 아래 조각의 `onClick`으로 전달되지 않고 라벨 자체가 이벤트를 가로챘다. 수정은 라벨 `<text>`의 인라인 스타일에 `pointerEvents: "none"` 한 줄 추가(140행 부근) — 클릭이 항상 아래 조각으로 통과하도록 함.
- Codex 작업 환경(샌드박스)에서 `npm run build`가 Google Fonts(`Manrope`/`Nunito`) 네트워크 요청 차단으로 실패해 최종 검증·커밋을 진행하지 못하는 상황이 발생했다. 코드 수정 자체는 올바르다고 판단해 Codex 서브에이전트에 남은 검증은 직접 처리하겠다고 전달했고, 서브에이전트도 "thin forwarder" 역할 제약에 따라 스스로 작업을 중단하고 인계했다.
- 인계받아 로컬(네트워크 제한 없는 환경)에서 `npx tsc --noEmit`, `npx eslint components/charts/asset-portfolio-chart.tsx`, `npm run build` 모두 통과 확인 후 직접 커밋·배포(`1a36a20`).
- 프로덕션에서 Playwright로 정밀 검증: 첫 테스트 시도들은 뷰포트 밖으로 스크롤된 좌표를 클릭하는 내 테스트 스크립트 자체의 버그(`boundingBox()` 값이 뷰포트 높이를 초과 → `document.elementFromPoint`가 `null` 반환)로 오탐이 발생했다. `scrollIntoViewIfNeeded()`를 추가해 라벨을 뷰포트 안으로 스크롤한 뒤 재검증하자, 클릭 좌표가 라벨이 아닌 `recharts-sector` 조각 엘리먼트에 정확히 히트하고, 단 한 번의 클릭만으로 선택 상세(`.mt-1` div)가 나타남을 확인 — 버그가 실제로 해결됐음을 프로덕션에서 직접 확인했다. 이 컴포넌트는 자산 페이지와 연간 요약 페이지 양쪽에서 공유되므로 두 화면 모두 수정 적용됨.

### fix - 연간 요약 지출/수입 비중 탭 통합 및 평균 계산 기준 수정

- **탭 통합**: 사용자가 지출 비중·수입 비중 도넛이 세로로 둘 다 나열돼 페이지가 너무 길어진다고 지적했다. 두 도넛을 `components/dashboard/category-breakdown-section.tsx`(신규, `"use client"`) 하나로 합치고, 이미 지출 추이 섹션(`expense-trend-section.tsx`)에 쓰던 것과 동일한 지출/수입 토글 탭 UI로 전환만 하도록 했다. `AssetPortfolioChart`는 그대로 재사용, 신규 npm 의존성 없음.
- **평균 계산 기준 수정**: 사용자가 "실제 데이터 없는 부분은 평균을 어떻게 계산하냐"고 물었다. 기존에는 월평균 잔액·예산 사용률의 월평균 지출액을 `monthsInYear`(달력상 경과 개월수 — 올해는 이번 달까지, 과거 연도는 12)로 나눴는데, 이 값에는 가입 전이거나 거래를 전혀 기록하지 않은(=`monthly_balances` 로우 자체가 없는) 달도 포함돼 평균이 부자연스럽게 낮아질 수 있었다. `monthsWithData = balancesResult.data?.length`(실제 기록이 있는 달 수, 0일 때는 1로 바닥 처리)로 나누도록 변경하고, 월평균 잔액 카드에 "n개월 기록 기준" 캡션을 추가해 어떤 기준으로 계산됐는지 명시했다. 추이 차트(`expenseTrend`/`incomeTrend`)는 달력상 모든 달을 그대로 보여줘야 하므로 손대지 않았다.
- **검증**: `npx tsc --noEmit`, `npx eslint .`, `npm run build` 통과. 프로덕션 배포(커밋 `482bea8`) 후 확인 — 테스트 계정은 7개월(1~7월) 중 실제 기록이 6개월뿐이라, 월평균 잔액이 기존 1,485,714원(7개월 기준)에서 1,733,333원(6개월 기준)으로, 예산 사용률의 월평균 지출액도 271,429원에서 316,667원으로 교정됨을 확인. 카테고리별 지출/수입 탭 전환("지출"↔"수입" 클릭 시 제목과 도넛 데이터가 함께 바뀜)도 정상 동작.

### fix - 연간 요약 지표 개선(월평균 잔액·예산 사용률 평균액·수입 비중)

- 사용자 요청에 따라 `/transactions/annual/[year]` 페이지 3가지를 개선했다.
- **월평균 잔액**: "연간 잔액" 카드를 "월평균 잔액"으로 바꾸고 `(연간 수입 - 연간 지출) / 경과 개월수`로 계산한다. 경과 개월수는 기존에 추이 차트에서 쓰던 `monthsInYear`(올해는 Asia/Seoul 기준 이번 달까지, 과거 연도는 12)를 그대로 재사용해 두 지표의 기준이 어긋나지 않는다.
- **예산 사용률 평균 금액 병기**: `components/reports/report-view.tsx`의 `StatCard`에 선택적 `caption` prop을 추가(기존 호출부는 영향 없음)하고, 연간 페이지의 예산 사용률 카드에 월평균 변동지출 금액(`variableExpense / monthsInYear`)을 작은 캡션으로 표시한다.
- **카테고리별 수입 비중**: `aggregateAnnualCategories`에 `type: "income" | "expense"` 파라미터를 추가해 지출뿐 아니라 수입도 같은 방식(상위 7 + 기타)으로 집계하고, 기존 지출 비중 도넛 위에 수입 비중 도넛을 동일한 `AssetPortfolioChart` 컴포넌트로 추가했다.
- 검증: `npx tsc --noEmit`, `npx eslint .`, `npm run build` 통과. 프로덕션 배포(커밋 `1e62a9a`) 후 기존 E2E 계정으로 직접 확인 — 월평균 잔액 1,485,714원(연간 잔액 10,400,000원 ÷ 7개월), 예산 사용률 63.3%·월평균 271,429원 지출(변동지출 1,900,000원 ÷ 7개월), 카테고리별 수입 비중 도넛(월급 100%) 정상 렌더. `fullPage` 스크린샷에서는 지출 추이 차트가 비어 보였으나, 스크롤 후 일반 뷰포트 캡처로는 정상 렌더됨을 확인 — recharts `ResponsiveContainer`가 fullPage 캡처의 리사이즈 타이밍에 반응하는 현상일 뿐 실제 회귀는 아님.

### test - 연간 요약 Phase 1 프로덕션 브라우저 시각 검증 및 배포 완료

- 코덱스가 연간 요약 Phase 1 구현(`4e213aa`)과 실 Supabase E2E(`86e42a0`)를 로컬 커밋까지 마친 뒤, 인앱 브라우저 자동화 연결이 끊겨 클라이언트 시각 확인 도중 중단된 지점을 이어받았다.
- 로컬 `npx tsc --noEmit`, `npx eslint .`, `npm run build`를 재확인(모두 통과, `/transactions/annual/[year]` 라우트 생성 확인)한 뒤 두 커밋을 `master`에 푸시하고 Vercel 프로덕션 배포를 확인했다.
- 기존 E2E 전용 계정으로 프로덕션(모바일 뷰포트 390×844)에서 직접 확인: 2026년 연간 수입 18,500,000원·지출 8,100,000원·잔액 10,400,000원·예산 사용률 63.3%가 서버 E2E 기댓값과 정확히 일치, 지출↔수입 추이 토글 정상 전환, 카테고리 도넛(임차료 74.1%부터 교통비 1.2%까지 8개) 정상 렌더, 데이터 없는 2025년은 예산 카드·도넛이 에러 없이 자동 숨김, 예산 실적 분석 헤더의 `연간 요약` 버튼이 올바른 연도로 이동, 잘못된 연도(`abcd`)·미래 연도(`2027`) 모두 현재 연도로 즉시 redirect.
- 콘솔 에러 0건 확인(기존에도 있던 recharts 컨테이너 크기 경고만 잔존, 신규 이슈 아님).
- 연간 요약 E2E 전용 계정은 시각 검증까지 완료되어 이제 다른 테스트 계정들과 함께 정리 대상으로 handoff.md에 반영했다.

### test - 연간 요약 실제 Supabase E2E 21/21 통과

- 기존 테스트 계정은 Git 이력에 이메일만 남고 비밀번호가 보존되지 않아 재사용할 수 없었다. 연간 요약 전용 테스트 계정을 새로 만들고 자격 정보는 Git에서 제외되는 `.env.local`의 `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD`에만 저장했다.
- 전용 가구에 2026년 수입·고정/변동/비정기 지출 20건, `monthly_balances` 6개월, `monthly_budgets` 6개월을 입력했다. 기대값은 연간 수입 18,500,000원, 지출 8,100,000원, 잔액 10,400,000원, 변동지출 1,900,000원 ÷ 예산 3,000,000원 = 63.3%다.
- 실제 Supabase 인증 쿠키를 로컬 Next.js 서버에 전달해 연간 요약 제목·네 요약값·추이·카테고리 도넛·이전/다음 연도 링크, 분석 페이지의 연간 요약 진입점, 데이터 없는 2025년의 도넛/예산 카드 미표시, `1999`·`abcd`·미래 연도의 현재 연도 이동, 비로그인 로그인 이동까지 21개 단언을 검증했고 모두 통과했다.
- 최초 로컬 서버가 제한된 네트워크에서 실행되어 Supabase 인증이 로그인 화면으로 되돌아가는 현상을 확인했으며, 네트워크가 허용된 동일 코드 서버에서 재실행하자 정상 통과해 애플리케이션 결함이 아님을 구분했다.
- 테스트 중 인앱 브라우저 자동화 연결이 끊겨 클라이언트 차트 토글과 모바일 시각 확인은 배포 후 재확인 대상으로 남겼다. Phase 2 코드는 계속 미착수 상태다.

### feat - 연간 요약 페이지 구현 (Phase 1)

- 조회 전용 동적 라우트 `/transactions/annual/[year]`를 추가했다. Asia/Seoul 기준 현재 연도를 사용해 4자리·2000~2100 범위 밖의 연도와 미래 연도를 현재 연도로 되돌리고, 기존 인증·가구 온보딩 게이트를 그대로 적용했다.
- `monthly_balances`의 12개월 수입·지출, `monthly_budgets`의 연간 예산 합계, `get_transactions_by_month` RPC의 연간 거래를 병렬 조회한다. 올해 추이는 현재 월까지만 만들며 과거 연도는 12개월 전체를 표시한다.
- 연간 예산 사용률은 프로젝트 규칙대로 `calculateBudgetUsagePercent(연간 예산 합계, 연간 변동지출)`로 계산해 고정·비정기 지출을 제외했다.
- 월별 추이는 기존 `ExpenseTrendSection`, 카테고리별 지출 비중은 기존 `AssetPortfolioChart`, 요약 카드는 `StatCard`를 export해 재사용했다. 카테고리는 지출액순 상위 7개와 나머지 `기타`로 최대 8개까지 표시한다.
- 예산 실적 분석 헤더에 해당 연도의 `연간 요약` 진입 버튼을 추가했다. 모바일에서는 헤더 버튼 행을 제목 아래로 내려 가로 오버플로를 막고, 연간 페이지에서는 기존 추이 컴포넌트의 자체 여백과 외부 여백이 중복되지 않게 정렬했다.
- 신규 마이그레이션·npm 의존성은 추가하지 않았으며, Phase 2의 보고서 기간 확장 라우트·서버 액션·DB 설계에는 착수하지 않았다.
- 검증: `npx tsc --noEmit`, `npx eslint .`, `npm run build` 통과. 빌드 결과에서 `/transactions/annual/[year]` 동적 라우트 생성을 확인했고, 프로덕션 서버 렌더 기준 잘못된 연도·미래 연도는 `/transactions/annual/2026`, 인증 없는 정상 연도는 `/login` 리다이렉트 마커를 확인했다.

### docs - 연간 요약 페이지 + AI 보고서 기간 확장 Codex 작업 지시서 작성

- `docs/tasks/annual-summary-and-report-period-expansion.md` 신설.
- **Phase 1 (지금 착수)**: 연간 수입/지출 추이와 카테고리별 지출 비중을 보여주는 조회 전용 페이지 `/transactions/annual/[year]`. 신규 마이그레이션 없이 기존 `monthly_balances`/`monthly_budgets`/`get_transactions_by_month` RPC로 집계. 신규 차트 컴포넌트 0개 — `ExpenseTrendSection`, `AssetPortfolioChart`, `report-view.tsx`의 `StatCard`(export 추가)를 그대로 재사용. 분석 페이지 헤더에 진입 버튼 추가.
- **Phase 2 (설계만, 착수는 나중)**: 월간 AI 보고서를 분기/반기/연간으로 확장하는 상세 설계 — 라이브 `monthly_reports` 테이블은 건드리지 않고 신규 `periodic_reports` 테이블로 분리(회귀 리스크 회피), 기존 `momCategoryDiffs` 등 필드명은 하위호환을 위해 유지하고 `periodLabel`/`previousPeriodLabel`만 추가, `/reports/[yearMonth]` → `/reports/[period]` 라우트 리네임안(기존 URL 호환 유지) 포함.
- 설계 검증: `StatCard`/`ExpenseTrendSection`/`calculateBudgetUsagePercent`/`isValidYearMonth`/`TransactionRpcRow`의 실제 시그니처를 코드에서 직접 확인 후 지시서에 반영.

### 깃허브 저장소 공개 전환 완료

- 사용자가 보안 마이그레이션(`20260715200000_remove_admin_email_backdoor.sql`)을 운영 Supabase Dashboard에서 직접 적용 완료.
- `gh repo edit`으로 저장소 가시성을 PRIVATE → PUBLIC으로 전환 완료 (https://github.com/StoneSilver0417/couple-finance).

## 2026-07-15

### security - 깃허브 저장소 공개 전환 대비 보안 점검 및 정리

- **점검 범위**: 전체 git 히스토리(모든 커밋)와 현재 추적 파일에서 `.env` 파일, Supabase 서비스 롤 키, Gemini API 키, GitHub 토큰, JWT 등 실제 비밀값이 노출된 적이 있는지 검색 — 히스토리 포함 전부 노출 이력 없음 확인.
- **[치명적] 신규 가입 시 특정 이메일 자동 관리자 권한 부여 백도어 발견 및 수정**: `20260212000001_db_optimization.sql`의 `handle_new_user()` 트리거가 운영자 이메일 또는 `admin@example.com`으로 가입하는 계정에 `is_admin=TRUE`를 자동 부여하고 있었고, 이후 이를 재정의한 마이그레이션이 없어 운영 DB에 그대로 적용돼 있을 가능성이 높았다. 저장소를 공개하면 정확한 우회 이메일이 그대로 노출되는 상황이라 `supabase/migrations/20260715200000_remove_admin_email_backdoor.sql`을 추가해 이메일 기반 자동 부여 로직을 제거하고, `admin@example.com`으로 이미 권한을 획득한 계정이 있다면 회수하도록 했다.
- **관리자 실제 이메일 마스킹**: `AGENTS.md`, `CHANGELOG.md`, 과거 마이그레이션 2개 파일(`20260210000001_admin_policy.sql`, `20260212000001_db_optimization.sql`)에 하드코딩돼 있던 운영자 실제 이메일을 `<REDACTED_ADMIN_EMAIL>` 또는 일반화된 문구로 교체 (기능에는 영향 없음, 텍스트만 정리).
- **테스트/데모 계정 이메일 정리**: `handoff.md`, `CHANGELOG.md`에 남아있던 E2E 테스트 계정·데모 계정 이메일 주소를 제거하고 일반화된 설명으로 대체.
- **`.gitignore` 보강**: `.codex-remote-attachments/`(사용자가 AI 도구에 업로드한 실제 스크린샷 원본 포함 가능), `.agents/`(로컬 스킬 데이터)를 무시 목록에 추가 — 둘 다 히스토리에 커밋된 적은 없으나, 공개 전환 후 실수로 커밋되는 것을 예방.
- **문제 없음으로 확인된 항목**: 현재 `isAdmin()`은 이메일이 아닌 `profiles.is_admin` 컬럼만 사용, `USING (true)` 같은 과도하게 허용적인 RLS 정책 없음, 초대 코드는 `crypto.randomBytes` 기반이라 예측 불가, `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`는 설계상 공개돼도 되는 키(RLS가 실질 방어선).
- DB 마이그레이션 실행은 Supabase Dashboard SQL Editor에서 수동 적용 필요(이 저장소는 CLI 자동 적용 미사용).

### fix - AI 보고서 예산 사용률을 홈 지출 분석과 통일

- 홈 지출 분석은 `변동지출 ÷ 설정 예산`을 사용하지만 AI 보고서는 `전체 지출 ÷ 설정 예산`을 사용해 고정·비정기 지출까지 포함되는 불일치를 확인했다.
- `calculateBudgetUsagePercent(totalBudget, variableExpense)` 공통 함수를 추가하고 홈 분석과 보고서 생성이 모두 이 함수를 사용하도록 변경했다.
- 신규 보고서의 통계·Gemini 입력·로컬 fallback 피드백은 고정·비정기 지출을 제외한 사용률을 사용한다.
- 기존 저장 보고서도 `totalBudget`과 `variableExpense`로 화면 사용률을 다시 계산하며, 저장된 예산 피드백에 이전 비율 문자열이 있으면 새 비율로 보정한다. AI 문구 전체를 새 기준으로 다시 분석하려면 재생성하면 된다.
- 검증: 전체 지출 기반 계산 경로 제거 확인, `npx tsc --noEmit`, `npx eslint .`, `npm run build` 통과.

### feat - 부부 공동 가계부 신규 앱 아이콘 적용

- 사용자가 제공한 정사각형 일러스트를 내용 변경 없이 앱 아이콘 원본으로 채택했다.
- `public/icon-192.png`, `public/icon-512.png`를 실제 명시 크기의 PNG로 교체하고 `public/apple-touch-icon.png`, `app/icon.png`, `app/apple-icon.png`를 추가했다.
- 브라우저 탭용 `app/favicon.ico`와 `public/favicon.ico`를 48px 아이콘으로 교체했다.
- PWA manifest에 `purpose: "any maskable"`을 추가하고 Next.js metadata가 favicon·192px·180px Apple 아이콘을 각 용도에 맞게 참조하도록 갱신했다.
- 검증: 모든 파일의 실제 픽셀 크기 확인, 512px 결과 육안 확인, `npx tsc --noEmit`, `npx eslint .`, `npm run build` 통과.

### docs - 홍보용 README 전면 재작성 및 사용법 가이드(USAGE.md) 신설

- **README.md**: create-next-app 기본 템플릿을 홍보용 문서로 전면 교체 — 타이틀/태그라인("함께 관리하는 똑똑한 자산 관리"), 기술 뱃지, 핵심 가치 4가지(투명성/협업/접근성/보안성), 주요 기능 7종(달력 가계부, 고정·변동·비정기 지출 구분, 예산 실적 분석, Flow/Stock 분리 자산 관리, AI 월간 보고서, 거래 복사, PWA), 스크린샷 갤러리(3×2), 기술 스택 표, 시작하기 3단계, 개발자용 로컬 실행 안내.
- **docs/USAGE.md** (신설): 처음 쓰는 부부 시점의 단계별 가이드 — 회원가입, 가구 생성·초대 코드, 거래 입력(지출 3분류 설명), 달력 사용법, 예산/분석, 자산 관리, AI 보고서(Google AI Studio 무료 키 발급 절차 포함), PWA 설치(iOS/Android), FAQ 5문항.
- **docs/images/** (신설, 9종): 데모 가구("도준이네 가계부")를 새로 만들어 거래 14건·자산 4건·예산을 입력한 뒤, 프로덕션에서 Playwright 모바일 뷰포트(390×844)로 직접 촬영. login/onboarding/dashboard/calendar/transaction-new/analysis/assets/settings/report. 각 130~210KB. AI 보고서는 유효 Gemini 키가 없어 "키 등록 안내" 화면으로 캡처.
- 데모 가구는 스크린샷 재촬영용으로 유지하기로 하고 handoff.md 정리 목록에 조건부 기록.

### fix - 보고서 본문 수입·지출 강조 및 요약 카드 정렬

- 사용자 표시 요청에 따라 상단 AI 요약 문장에서 서버 집계 수입·지출 금액과 정확히 일치하는 문자열을 찾아 각각 초록·분홍 강조 표식으로 렌더링한다.
- 이번 달 요약 카드 네 장에 동일한 최소 높이를 지정하고 아이콘·라벨·금액을 중앙 정렬했다. 금액에는 `tabular-nums`와 줄바꿈 방지를 적용해 카드별 숫자 폭이 달라도 기준선과 여백이 안정적으로 보인다.
- 검증: `npx tsc --noEmit`, `npx eslint .`, `npm run build` 통과.

### fix - 관리자 가입일·카드 정렬 및 보고서 요약 금액 강조

- 사용자 스크린샷에서 관리자 사용자 카드의 가입일이 `1970. 01. 01.`로 표시되는 문제를 확인했다. 기존 RPC가 신뢰할 수 없는 `profiles.created_at`을 사용한 것이 원인이므로, 실제 Supabase Auth 계정 생성일인 `auth.users.created_at`을 우선 반환하는 교정 마이그레이션을 추가했다.
- 사용자 카드 상단은 이름·역할 배지와 이메일·가구명을 두 행으로 정돈하고, 가입일·마지막 로그인·마지막 활동은 고정 라벨 열과 우측 정렬 값 열로 재배치했다. 로그인·활동 시각은 연도를 생략해 모바일 폭에서 겹치지 않게 했다.
- 월간 보고서의 수입·지출 요약 금액을 각각 초록·분홍으로 강조하고 같은 계열의 옅은 배경과 테두리를 적용했다.
- 사용자가 가입일 교정 SQL을 운영 DB에 적용했다. 검증: `npx tsc --noEmit`, `npx eslint .`, `npm run build` 통과.

### feat - 관리자 사용자 현황 페이지 구현

- `supabase/migrations/20260715100000_admin_user_overview.sql`에 관리자 전용 `admin_get_user_overview()` RPC를 추가했다. `SECURITY DEFINER`로 `auth.users.last_sign_in_at`을 조회하되 함수 첫머리에서 호출자의 `profiles.is_admin`을 검사하고, PUBLIC·anon 실행 권한을 회수했다.
- `/admin/users` 서버 페이지를 추가해 총 사용자·총 가구·이번 달 신규 가입자 수를 파생 계산하고 사용자별 가입일·마지막 로그인·마지막 활동을 모바일 카드 목록으로 표시한다.
- 관리자 화면 공통 2-pill 탭을 추가해 `/admin/feedbacks`와 `/admin/users` 사이를 이동할 수 있게 했다. 비관리자는 기존 `isAdmin()` 게이트로 `/settings`에 리다이렉트한다.
- 설정의 관리자 콘솔 설명을 `피드백 답변 · 사용자 현황 관리`로 갱신했다.
- 사용자가 운영 Supabase Dashboard SQL Editor에서 마이그레이션 실행을 완료했다. 자동 브라우저에 관리자 로그인 세션이 없어 인증 후 런타임 E2E 검증은 실사용 확인으로 남겼다.
- 기능 커밋 `3a3b073`을 `master`에 푸시했고 Vercel 프로덕션 배포 `dpl_45u363NbrrDGNLzsRVoaVDZoieys`가 `Ready` 상태로 운영 별칭에 연결됐다. 비로그인 `/admin/users` 접근이 `/login`으로 리다이렉트되는 것을 확인했다.
- 검증: `npx tsc --noEmit`, `npx eslint .`, `npm run build` 통과.

### feat - AI 보고서 진입점을 분석 화면으로 이전

- 예산 실적 분석 화면 헤더에 `AI 보고서` 버튼을 추가해 보고 있는 달의 보고서로 바로 이동하도록 했다.
- 미래월 분석 화면에서는 Asia/Seoul 기준 현재월로 보고서 링크를 클램프해 보고서 페이지의 리다이렉트 없이 자연스럽게 이동한다.
- 설정 메뉴 그리드의 `AI 월간 보고서` 항목과 전용 아이콘을 제거하고, 현재월 계산 헬퍼를 단순화했다. AI 키 관리 다이얼로그 안의 `이번 달 보고서 보러가기` 링크는 유지했다.
- 커밋: `d8382d0`.
- `master`에 푸시하고 위 관리자 사용자 현황 기능과 함께 프로덕션 배포했다.
- 검증: `npx tsc --noEmit`, `npx eslint .`, `npm run build` 통과.

### fix - 월간 보고서 모바일 가독성 개선

- 사용자가 제공한 모바일 스크린샷에서 상단 인사이트 카드, 요약 카드, 전월 대비 변화 카드의 텍스트가 작고 대비가 약해 읽기 어렵다는 문제가 확인됐다.
- `components/reports/report-view.tsx`에서 보고서 카드 배경을 더 불투명한 흰색 계열로 바꾸고, 제목/본문/보조 텍스트의 크기와 줄간격을 올렸다.
- 전월 대비 변화 항목은 모바일에서 제목·금액 행과 증감 배지가 세로로 쌓이도록 변경해 긴 금액이 눌리거나 작게 보이는 문제를 줄였다.
- `app/(app)/reports/[yearMonth]/page.tsx`에서 모바일 좌우 여백을 `px-4`로 줄여 카드 내부 텍스트 폭을 확보하고, 생성 정보 카드의 대비와 글자 크기도 조정했다.
- 검증: `npx tsc --noEmit`, `npx eslint .`, `npm run build` 통과.

### fix - Gemini 한도 초과 시 로컬 보고서 fallback 추가

- 사용자가 제공한 스크린샷에서 `generate_content_free_tier_input_token_count`, `generate_content_free_tier_requests`가 모두 `limit: 0`으로 확인됐다. 이는 “한도를 다 쓴 상태”라기보다 해당 프로젝트/계정 조합에서 무료 생성 한도가 배정되지 않은 상태다.
- 결제 연결 없이도 보고서 화면을 쓸 수 있도록 Gemini 생성 실패 시 앱에서 계산한 집계만으로 한국어 보고서 문구를 생성하는 fallback을 추가했다.
- fallback 보고서는 기존 `MonthlyReportContent` 구조를 그대로 사용해 화면 변경 없이 표시되며, 저장 모델은 `gemini-2.0-flash-lite+local-fallback`으로 남긴다.
- 검증: `npx tsc --noEmit`, `npx eslint .`, `npm run build` 통과.

### fix - Gemini 한도 오류 상세 문구 추가

- 사용자가 새 프로젝트/새 키에서도 같은 무료 한도 문구가 뜬다고 보고했다.
- 기존에는 Gemini 429 응답을 모두 같은 문구로 매핑해 RPD/RPM/TPM/프로젝트 subject 등 실제 원인을 구분할 수 없었다.
- `lib/ai/gemini.ts`에서 비정상 응답 본문을 파싱해 quota violation detail 또는 Gemini error message를 사용자 오류 문구와 서버 로그에 포함하도록 변경했다.
- 검증: `npx tsc --noEmit`, `npx eslint .`, `npm run build` 통과.

### fix - Gemini 무료 한도 오류 완화 및 키 교체 UX 개선

- 사용자가 다른 Google 계정의 신규 키를 적용해도 429 무료 한도 오류가 지속된다고 보고했다.
- 월간 보고서는 짧은 구조화 JSON 생성이므로 기본 Gemini 모델을 `gemini-2.0-flash`에서 `gemini-2.0-flash-lite`로 변경해 무료 한도 소모를 줄였다.
- 설정 다이얼로그에서 키가 이미 등록된 상태에도 새 키를 바로 입력해 교체 저장할 수 있도록 폼을 추가했다. 기존에는 등록 상태에서 삭제 버튼만 보여 실제로 새 키가 반영되지 않았을 가능성이 있었다.
- 429 오류 문구를 “잠시 후 재시도”만 안내하지 않고 AI Studio 프로젝트 한도 확인까지 안내하도록 바꿨다.
- 검증: `npx tsc --noEmit`, `npx eslint .`, `npm run build` 통과.

### fix - Gemini 신규 Auth key 형식 지원

- Google AI Studio 공식 문서(2026-07-13 기준)에서 신규 API 키가 기본적으로 Authorization/Auth key로 생성되며, 기존 `AIza` prefix만 보장되지 않는 것을 확인했다.
- `lib/report-actions.ts`의 `AIza` prefix 강제 검증을 제거하고 길이 확인 후 실제 Gemini API 검증 결과로 저장 여부를 판단하도록 변경했다.
- `lib/ai/gemini.ts`의 키 검증/보고서 생성 REST 호출을 query string `?key=` 방식에서 `x-goog-api-key` 헤더 방식으로 변경해 신규 Auth key 사용 경로에 맞췄다.
- 설정 화면 placeholder와 저장된 키 마스킹을 특정 prefix에 의존하지 않도록 수정했다.
- 커밋 `3fe5275`를 `master`에 푸시했고 Vercel 프로덕션 배포 `dpl_Ge5iXxjrpZWUmtU7soB54LaSEojH`가 `Ready` 상태로 운영 별칭 `https://couple-finance-roan.vercel.app`에 연결됐다.
- 검증: `npx tsc --noEmit`, `npx eslint .`, `npm run build` 통과.

### feat - 월간 AI 가계부 분석 보고서 구현 완료

- **커밋/배포**: 기능 커밋 `6974aff`를 `master`에 푸시했고 Vercel 프로덕션 배포 `dpl_D5SL7JVy26M4cC9JKnAu7ChpvVPw`가 `Ready` 상태가 됐다. 운영 별칭 `https://couple-finance-roan.vercel.app` 연결과 인증 전 보고서 경로의 로그인 리다이렉트 콘텐츠를 확인했다.
- 사용자가 운영 Supabase 프로젝트 `ieahmpxiaamesrnfgbng`의 SQL Editor에서 `20260715000000_ai_reports.sql` 적용을 완료했다.
- `types/report.ts`에 앱 계산 수치와 AI 문구를 분리한 `MonthlyReportContent` 타입을 추가했다. 숫자는 서버에서 계산하고 Gemini는 텍스트 필드만 반환한다.
- `lib/ai/gemini.ts`에 네이티브 `fetch` 기반 Gemini REST 연동을 추가했다. `gemini-2.0-flash`, JSON response schema, 45초 중단, 상태별 한국어 오류, 필수 필드·문자열 길이·배열 개수 런타임 검증을 적용했다.
- `lib/report-actions.ts`에 가구 컨텍스트와 외부 입력 검증을 적용한 API 키 저장/삭제 및 보고서 생성 액션을 추가했다. 당월·전월 거래, 예산, 최근 6개월 잔액, 최근 자산 기록을 병렬 조회하고 앱에서 수입·지출·예산 사용률·카테고리 증감·순자산 변화를 계산한다.
- 프라이버시 경계를 명시적으로 유지했다. Gemini 입력에는 카테고리 집계, 지출 유형 집계, 추세, 고액 지출 5건의 카테고리/금액/날짜만 포함하며 거래 `memo`는 타입과 매핑 단계에서 제외했다. API 키 원문은 서버 전용 모듈/서버 액션/서버 설정 페이지에서만 읽고 클라이언트에는 `AIza…마지막4자`만 전달한다.
- `/reports/[yearMonth]` 서버 페이지와 생성 카드·보고서 뷰를 추가했다. 월 이동, 미래 월 차단, 키 미등록 안내, 생성 중 상태, 구조화된 수치·전월 변화·예산 피드백·절약 팁·자산·칭찬 섹션, 재생성 및 생성 모델/시각 표시를 제공한다.
- 설정 페이지에 지난달 AI 보고서 메뉴와 Gemini 키 관리 다이얼로그를 추가했다. 무료 키 발급 링크, 평문 저장/무료 티어 키 권장 고지, 키 삭제, 이번 달 보고서 링크를 포함한다.
- React 19 규칙에 맞춰 성공/오류 토스트와 새로고침을 `useActionState` 액션 래퍼에서 처리했으며 effect 기반 후처리는 추가하지 않았다. 새 npm 의존성도 없다.
- 선택 단계인 대시보드 보고서 티저는 핵심 기능 범위와 독립적이므로 추가하지 않았다.
- 검증: `npx tsc --noEmit` 통과, `npx eslint .` 0 오류·0 경고, `npm run build` 성공. 새 라우트가 동적 서버 라우트로 등록됐고 인증 전 접근이 `/login`으로 리다이렉트됨을 브라우저에서 확인했다. 로그인 세션과 정상 Gemini 키가 없어 등록·생성 성공 경로 E2E는 후속 검증으로 남겼다.

### feat - 월간 AI 보고서 DB 마이그레이션 작성(수동 적용 대기)

- `docs/tasks/ai-monthly-report.md`의 1단계에 따라 `supabase/migrations/20260715000000_ai_reports.sql`을 추가했다.
- 가구당 Gemini API 키 1개를 저장하는 `household_ai_settings`와 월별 구조화 보고서를 저장하는 `monthly_reports` 테이블, 두 테이블의 가구 소속 기반 RLS 정책을 정의했다.
- API 키는 평문 컬럼에 저장되므로 이후 애플리케이션 코드에서 서버 내부 조회만 허용하고, 클라이언트에는 등록 여부와 서버에서 계산한 마스킹 값만 전달하는 설계를 유지한다.
- 이 저장소는 CLI 마이그레이션 자동 적용을 사용하지 않으므로 운영 프로젝트 `ieahmpxiaamesrnfgbng`의 Supabase Dashboard SQL Editor에서 사용자가 직접 SQL을 실행해야 한다. 작업 지시서의 강제 중단 조건에 따라 실행 완료 확인 전까지 2단계 이후 구현과 런타임 검증을 보류했다.
- 검증: 신규 SQL 내용 재확인 및 `git diff --check` 통과. 애플리케이션 코드 변경 전이므로 타입·린트·빌드는 아직 실행하지 않았다.

## 2026-07-03

### fix - 6개월/전체 등 긴 기간 자산 추이 그래프 지글거림 수정 (커밋 `d780d70`)

- **증상**: "6개월"/"전체" 기간으로 볼 때 그래프 선이 잘게 지글거려 추이를 알아보기 힘듦 (사용자 제보 — 일별 조회 자체는 유지하고 싶다는 요청)
- **원인**: 자산을 자주 수정하는 가구는 일별 스냅샷이 수십~수백 개까지 쌓이는데, 모든 점을 `type="monotone"`으로 그대로 이어 그리다 보니 사소한 일별 등락까지 전부 선에 반영돼 노이즈처럼 보임
- **수정**: 데이터 저장/조회는 그대로 일별 유지. 화면 표시 시점(`assets-page-client.tsx`의 `trendData`)에서 필터링된 점 개수가 30개(`MAX_TREND_POINTS`)를 넘으면, 균등한 구간으로 나눠 각 구간의 마지막(가장 최신) 값만 남기는 다운샘플링을 추가. 평균이 아니라 "구간의 최신값"을 쓰므로 실제 추세 방향이 왜곡되지 않음. 1/3개월처럼 점이 이미 적은 기간은 그대로 일별 표시
- **검증**: Node 스크립트로 31/100/365개 길이의 배열을 다운샘플링해 항상 30개 안팎으로 줄어들고 마지막 값이 보존되는지 확인, 프로덕션 배포 후 기간 탭 전환 시 콘솔 에러 없음을 확인

### fix - 자산 변동 기록 차트 최소 변동폭 강제 (커밋 `921de16`)

- **증상**: 실제로는 소폭(예: 1~2%)인 변동인데도 그래프 기울기가 급락처럼 과장돼 보임 (사용자 제보)
- **원인**: nice-number 축이 실제 데이터의 최소~최대값에만 딱 맞춰 계산되다 보니, 값이 조금만 움직여도 Y축이 그 좁은 구간에 맞춰 확대되어 200px 높이를 꽉 채움
- **수정**: `getNiceTicks`가 자산 규모(값의 절대값 중 큰 쪽)의 15%를 최소 폭으로 강제하도록 변경 — 실제 변동폭이 이보다 작으면 축을 그 최소폭만큼 넓혀서 완만하게 표시. "만" 단위 정수 표시 특성상 step이 1 미만이면 눈금이 중복 표시되는 문제도 함께 발견해 step 최소값을 1로 클램프
- **검증**: Node 스크립트로 소폭 변동(4200~4250, 3500~5000으로 확장), 평평한 값(0/500/-1), 큰 변동 등 8가지 케이스를 재계산해 모두 중복 없이 적절한 폭으로 나오는지 확인

### fix - 자산 수정 시 총 순자산/포트폴리오/목록 즉시 갱신 안 되던 문제 (커밋 `1456cb8`)

- **증상**: 자산 금액을 수정하면 서버에는 정상 반영되지만(하드 리로드하면 보임), 화면은 새로고침 전까지 이전 값을 계속 보여줌
- **원인**: `app/(app)/assets/assets-page-client.tsx`의 `filteredAssets`가 `useState<Asset[]>(assets)`로 props를 그대로 복사해 마운트 시점에 고정되는 전형적인 "props를 state로 미러링" 안티패턴이었음. `updateAsset`/`deleteAsset` 서버 액션이 `revalidatePath("/assets")`를 호출해도, 클라이언트가 그 결과로 새 `assets` props를 받으려면 별도로 `router.refresh()`가 필요했고(이것도 누락돼 있었음), 설령 refresh가 일어나도 이미 고정된 `filteredAssets` state는 새 props를 반영하지 못했음
- **수정**:
  - `asset-dialog.tsx`(생성/수정)와 `assets-list-client.tsx`(삭제) 성공 시 `router.refresh()` 호출 추가
  - `filteredAssets`를 `useState`로 복사하는 대신 `(assets, activeFilterId)`에서 매 렌더 다시 계산하는 `useMemo`로 교체 — 항상 최신 `assets` prop을 반영. 중복돼 있던 필터링 로직(`asset-filter-tabs.tsx`)은 제거하고 탭은 선택된 필터 ID만 부모로 전달
- **검증**: 프로덕션에서 같은 자산의 금액을 5차례 반복 수정(100만→350만→900만→1235만→2000만)하며 새로고침 없이 총 순자산/포트폴리오/자산 목록이 즉시 갱신됨을 확인
- **[별개 발견, 미해결]**: 같은 날 자산을 여러 번 수정하면 "자산 변동 기록" 차트의 `asset_history` 스냅샷은 그날 최초 값에 고정되고 이후 수정이 반영되지 않음. `saveAssetSnapshot()`의 upsert가 에러 없이 "성공"하지만 실제로는 갱신되지 않는 것으로 보임(Vercel 런타임 로그에 에러 없음). DB 직접 조회 없이는 원인 확정이 어려워 별도 이슈로 handoff.md에 기록, 이번 수정 범위에는 포함하지 않음

### fix - 자산 변동 기록 차트 Y축 nice-number 적용 및 클릭 시 테두리 제거 (커밋 `8c64fff`)

- **증상 1**: Y축 눈금이 "4663만", "3707만", "-293만"처럼 어중간한 값으로 표시됨 (사용자 스크린샷 제보)
- **원인**: 기존 `domain={[minValue-padding, maxValue+padding]}` + `tickCount={4}`가 실제 데이터 최소/최대값에 여백만 더한 원시 숫자를 그대로 축 범위로 쓰고 그 구간을 기계적으로 4등분해서, 결과 눈금 값이 항상 어중간했음
- **수정 1**: Heckbert의 "nice number" 알고리즘(`niceNum`/`getNiceTicks`, `components/charts/asset-trend-chart.tsx`)을 도입해 축 domain과 ticks를 500/1000/2000만 등 깔끔한 단위로 반올림해서 계산. 전 구간 값이 동일한 평평한 선 예외 케이스는 값 크기에 비례한 여백을 둬 처리, `-0` 표시 방지 처리 포함
- **검증 1**: Node 스크립트로 스크린샷과 동일한 값(-130~4250), 평평한 값, 0, 음수, 큰 값 등 6가지 케이스를 계산해 모두 깔끔한 눈금이 나오는지 확인 (예: -130~4250 → -2000/0/2000/4000/6000)
- **증상 2**: 차트를 클릭/탭하면 검은 포커스 테두리가 바깥·안쪽 이중으로 나타남
- **원인**: Recharts가 SVG 및 내부 레이어에 기본 접근성용 포커스 스타일을 적용하는데, 포트폴리오 파이차트(`asset-portfolio-chart.tsx`)에는 이미 제거 처리가 있었지만 트렌드 차트에는 빠져있었음
- **수정 2**: 동일한 `outline: none` + `-webkit-tap-highlight-color: transparent` + `box-shadow: none` 패턴을 svg/recharts-wrapper/recharts-surface/recharts-area/recharts-layer 전체에 스코프 적용
- **검증**: `tsc`/`eslint`/`next build` 클린, 프로덕션 배포 후 Playwright로 탭 전환·단일 데이터 케이스 무오류 확인. **다중 데이터 포인트 렌더링(실제 눈금·테두리 제거) 육안 확인은 못함** — 이전 자산 차트 개선과 동일하게 앱이 하루 1 스냅샷만 허용해 테스트 계정에서 다일 이력을 재현할 수 없었음

### fix - 자산 변동 기록 차트 점/라벨 과다 표시 개선 (커밋 `cd1a3d2`)

- **증상**: 자산 페이지의 "자산 변동 기록" 차트가 데이터가 쌓일수록 점(dot)과 X축 날짜 숫자가 서로 겹쳐 지저분해짐
- **원인**: `AssetTrendChart`(`components/charts/asset-trend-chart.tsx`)가 모든 데이터 포인트에 dot을 그리고, X축에도 포인트 개수만큼 MM/DD 라벨을 전부 렌더링. 조회 기본 범위도 6개월이라 자산을 자주 수정하는 가구는 점이 수십~180개까지 쌓임
- **수정**:
  - `Area`의 `dot`을 제거하고 `activeDot`(hover 강조점)만 유지
  - X축 `interval`을 `Math.ceil(길이/6)-1`로 계산해 데이터 개수와 무관하게 라벨이 최대 6개만 남도록 함, `minTickGap` 추가
  - Y축 `tickCount={4}`로 눈금 수 제한
  - 자산 페이지(`assets-page-client.tsx`)에 1/3/6개월·전체 기간 탭 추가(기본 3개월)로 점 개수를 사용자가 직접 조절 가능하게 함. 탭을 위해 서버 조회 범위(`app/(app)/assets/page.tsx`)를 6개월 → 12개월로 확장(단일 쿼리, 자산 스냅샷은 하루 1건이라 성능 영향 미미)
- **검증**: 프로덕션 배포 후 Playwright로 기간 탭 전환·단일 데이터 케이스가 콘솔 에러 없이 동작함을 확인. X축 라벨 개수 제한 계산식은 다양한 데이터 길이(2/7/12/30/180)에 대해 수식으로 재검증(모두 ~6개 라벨로 수렴). **다수 데이터 포인트가 실제로 겹치지 않는지의 육안 확인은 하지 못함** — 앱이 가구당 하루 1 스냅샷만 upsert하도록 설계되어 있어(record_date는 서버 오늘 날짜 고정), 테스트 계정에서 여러 날짜에 걸친 이력을 한 세션에서 재현할 수 없었음. 실사용 계정(수 주~수개월 이력 보유)에서 시각적으로 재확인 권장

### fix - 거래 삭제 확인창 버튼 여러 번 눌러야 반응하는 문제 (커밋 `b177c5a`)

- **증상**: 거래 삭제(드롭다운 메뉴 > 삭제 > 확인창 > 삭제) 버튼이 첫 클릭에 반응하지 않고 여러 번 눌러야 삭제되는 문제 (사용자 프로덕션 스크린샷 제보)
- **원인**: Radix UI DropdownMenu는 열려있는 동안 `document.body.style.pointerEvents = "none"`을 걸어 배경 클릭을 막는데, 이 잠금은 메뉴가 닫히는 애니메이션이 끝나야(약 150~200ms) 해제됨. `components/ui/confirm-dialog.tsx`의 삭제 확인창은 Radix 컴포넌트가 아닌 자체 구현(motion.div)이라 잠금 해제 대상에서 빠져있어, 드롭다운이 닫히는 도중 뜬 확인창 버튼도 body의 `pointer-events: none`을 그대로 상속받아 클릭이 씹혔음
- **수정**: 확인창 최상위 오버레이에 `style={{ pointerEvents: "auto" }}`를 명시해 body의 잠금을 무시하도록 함 (Radix 자신의 오버레이 레이어가 쓰는 것과 동일한 해법). `useConfirm()`을 쓰는 모든 삭제 확인창(거래/카테고리/자산 등)에 공통 적용됨
- **검증**: 프로덕션에서 Playwright로 재현 — 삭제 메뉴 클릭 직후 `document.body.style.pointerEvents`가 실제로 `"none"`임을 확인했고, 수정 후 확인창 오버레이의 computed `pointer-events`는 `"auto"`로 이를 무시함을 확인. 확인창 삭제 버튼 단일 클릭으로 거래가 정상 삭제되는 것을 end-to-end로 검증 완료 (테스트 계정/데이터는 handoff.md 정리 TODO에 추가)

## 2026-06-13

### v0.6.4 배포 및 검증 완료

- **프로덕션 배포 완료**:
  - `git push`를 실행하여 Vercel Production에 자동 배포를 수행하고 완료 상태를 확인했습니다.
- **E2E 및 실서버 검증**:
  - 개발용 Supabase 데이터베이스 도메인이 제공되지 않는 관계로, 실제 운영용 Supabase 프로젝트(`ieahmpxiaamesrnfgbng.supabase.co`)를 가리키도록 `.env.local` 설정을 갱신하였습니다.
- **E2E 및 실서버 검증**:
  - 실제 운영용 Supabase 프로젝트(`ieahmpxiaamesrnfgbng.supabase.co`)를 가리키도록 `.env.local` 설정을 갱신하였습니다.
  - 브라우저 서브에이전트(Playwright)를 통해 회원가입 → 가구 생성(온보딩) → 로그인 → 메인 대시보드 → 카테고리 다이얼로그 렌더링에 이르는 전 과정을 검증 완료했습니다.
  - **주의**: 테스트 과정에서 운영 DB에 테스트 계정 및 "Test Household" 가구 데이터가 생성됨 → 다음 세션에서 SQL로 정리 필요
- **Supabase 환경 오기록 수정**:
  - 과거 handoff/AGENTS.md에 기록된 `tsqro...`, `bgevp...` 주소는 실존하지 않는 잘못된 기록이었음 (실제 주소는 `ieahmpxiaamesrnfgbng.supabase.co` 하나뿐)


## 2026-06-12

### v0.6.4 - 클라이언트/UI 계층 전면 리팩토링 (lint 101개 문제 → 0개)

- **타입 안전성 확보 (`any` 35건 제거)**
  - `types/index.ts`에 `TransactionRpcRow` 공유 타입 신설 — RPC `get_transactions_by_month` 평탄화 행을 3개 페이지(대시보드, 월별, 분석)에서 중복 정의하던 것을 통일
  - 카테고리/자산/피드백 컴포넌트들이 로컬 `any` 대신 `@/types`의 `Category`, `Asset` 공유 타입 사용
  - 아이콘 타입 `any` → `LucideIcon`, recharts 콜백 `any` → `PieLabelRenderProps`/유니언 타입
  - Supabase 쿼리 결과는 경계에서 한 번만 명시 캐스팅하는 패턴으로 정리
- **React 19 권장 패턴 적용 (setState-in-effect 8건 제거)**
  - `asset-dialog`, `category-dialog`: 폼을 내부 컴포넌트로 추출 + `key` 리마운트로 effect 기반 상태 초기화 제거 (Radix Dialog는 닫히면 언마운트되는 점 활용)
  - `budget-client`: 부모 페이지에서 `key={year-month}` 리마운트로 동기화 effect 제거
  - `feedback-dialog`: 성공/오류 토스트를 effect → `useActionState` 액션 래퍼로 이동, 기기 정보를 상태+hidden input → 제출 시점 수집으로 변경, 문의함 조회를 effect → 탭/오픈 이벤트로 이동
  - `activity-log-sheet`: 데이터 로딩을 effect → Sheet 오픈 이벤트로 이동
  - `pwa-install-button`: iOS/standalone 감지를 effect 내 setState → `useSyncExternalStore`로 교체
- **잠재 버그 수정**
  - `categories-client`: `?mode=add` 딥링크 처리 시 `history.replaceState`가 Next 라우터의 searchParams를 갱신하지 않아 탭 전환 시 다이얼로그가 재오픈될 수 있던 버그 → "이전 렌더 mode 비교" 패턴 + `router.replace`로 수정
- **죽은 코드 제거**
  - 미사용 `components/charts/category-chart.tsx` 파일 삭제
  - 미사용 임포트/변수 약 30건 정리 (`formatFullAmount`, `KAKAO_OPEN_CHAT_URL` 등)
- **검증**: `tsc --noEmit` 통과, `eslint` 0 오류 0 경고, `next build` 성공, 로컬 로그인 페이지 브라우저 렌더링 정상(콘솔 오류 0)

## 2026-06-11

### v0.6.3 - 서버 액션 전면 보안 리팩토링

- **공개 엔드포인트 격리 (High)**
  - `lib/balance-actions.ts`: `syncMonthlyBalance`가 공개 서버 액션으로 노출되어 인증 없이 임의 가구 ID로 호출 가능했던 문제 → `"use server"` 제거, 호출자의 Supabase 클라이언트를 전달받는 서버 내부 모듈로 전환
  - `lib/activity-log.ts` (신규): 기존 `createActivityLog` 공개 액션으로 누구나 활동 로그를 위조 삽입할 수 있던 문제 → 내부 함수 `logActivity`로 격리, `activity-log-actions.ts`는 조회/삭제 액션만 유지
- **공통 모듈 추출 (리팩토링)**
  - `lib/supabase/household-context.ts` (신규): 로그인 확인 + 가구 ID 조회를 `getHouseholdContext()` 단일 진입점으로 통합. 액션마다 중복되던 인증/소속 확인 보일러플레이트 제거 (13개 파일, 약 -565줄)
  - `lib/validation.ts` (신규): 금액(상한 1천억, 유한성), 날짜(YYYY-MM-DD), 연/월 범위, 문자열 길이, 거래/자산 유형 화이트리스트 등 외부 입력 검증 유틸 집중화
- **외부 입력 검증 강화 (Medium)**
  - 모든 서버 액션에서 `formData.get(...) as string` 무검증 캐스팅 제거
  - `feedback-actions.ts`: 피드백 유형 화이트리스트, 내용 5,000자 제한, `deviceInfo` JSON 안전 파싱(2,000자 제한)
  - `admin-actions.ts`: 피드백 상태값 화이트리스트, 답변 길이 제한
  - `household-actions.ts`: 가구명/사용자명 50자 제한, 초대 코드 null 입력 시 `.toUpperCase()` 크래시 방어
  - `auth-actions.ts`: 이메일/비밀번호 존재·길이 검증 추가 (비밀번호 6자 미만 사전 차단)
- **보안 헤더 및 빌드 설정 개선 (Medium)**
  - `next.config.ts`: 프로덕션 CSP에서 `'unsafe-eval'` 제거 (개발 모드 HMR에서만 허용)
  - 폐기된 `X-XSS-Protection` 헤더를 `Referrer-Policy: strict-origin-when-cross-origin`으로 교체
  - `typescript.ignoreBuildErrors: true` 제거 → 빌드 시 타입 오류 강제 검출

## 2026-05-16

### v0.6.2 - 거래 복사 기능 추가

- **거래 복사 기능 (Copy & Paste Transactions)**
  - 파일: `app/(app)/transactions/transactions-list-client.tsx`, `components/calendar/day-transactions-modal.tsx`, `app/(app)/transactions/new/page.tsx`
  - 내용: 기존 거래 항목(메인 목록 및 캘린더 모달)에 '복사' 메뉴 추가. 클릭 시 기존 거래의 금액, 카테고리, 메모 등의 정보를 URL 쿼리스트링에 담아 새 거래 추가 폼에 자동으로 채워주는 기능 구현. 매월 반복되거나 비슷한 거래를 빠르게 입력 가능.
## 2026-05-14

### v0.6.1 - 거래 삭제 버그 수정

- **`ConfirmDialog` Promise 미해결 버그 수정 (Critical)**
  - 파일: `components/ui/confirm-dialog.tsx`
  - 원인: `useState`의 setter(`setResolveRef(() => resolve)`)에 함수를 전달하면 React가 이를 "함수형 업데이트(functional update)"로 해석, `resolve`를 state setter의 인자로 **즉시 호출**하고 반환값(`undefined`)을 state에 저장함
  - 결과: `resolveRef`가 항상 `null`이므로 확인/취소 버튼 클릭 시 `Promise`가 영원히 pending 상태 → `await confirm()`이 반환되지 않아 `deleteTransaction` 등 후속 삭제 로직이 절대 실행되지 않음
  - 수정: `useState` → `useRef`로 교체. `resolveRef.current`에 함수 참조를 직접 저장하여 React의 함수형 업데이트 해석을 우회

## 2026-02-12

### v0.6.0 - 보안 아키텍처 대규모 강화

- **RPC 함수 보안 취약점 해결 (High)**
  - `create_household_with_owner`, `join_household_as_member` 함수 인자에서 유저 ID 제거
  - SQL 내부에서 `auth.uid()`를 직접 참조하도록 변경하여 인자 조작을 통한 권한 탈취 원천 차단
- **초대 코드 생성 보안 강화 (Medium)**
  - `Math.random()`을 암호학적으로 안전한 `crypto.randomBytes`로 교체
- **서버 단 이중 소유권 검증 도입 (Defense in Depth)**
  - 거래(Transaction), 카테고리(Category), 자산(Asset)의 수정/삭제 시 서버 액션에서 가구 ID 일치 여부를 명시적으로 재검증
  - DB RLS와 애플리케이션 계층의 이중 보안 체계 구축
- **코드 품질 및 안정성 개선**
  - Next.js Server Actions의 타입 안전성 및 가독성 향상

## 2026-02-10

### v0.5.5 - 관리자용 피드백 답변 시스템 완료

- **개발자 전용 관리자 콘솔 추가**
  - 지정된 관리자 계정 전용 관리자 페이지 구축
  - 사용자 문의 내역 상세 조회 및 답변(admin_comment) 작성 기능
  - 기기 정보(OS, 브라우저 등) 확인 기능으로 버그 대응력 강화
- **보안 및 RLS 정책 강화**
  - Supabase RLS를 JWT 기반 이메일 검증 방식으로 개선하여 보안성 확보
  - `feedbacks` 테이블 생성 및 `profiles` 조인 최적화
- **사용자 문의 환경 개선**
  - '내 문의함' 기능으로 답변 상태 실시간 확인 가능
  - 카카오톡 대신 이메일/앱 내 문의로 간편화

### v0.5.0 - 고객 지원 및 피드백 시스템 구축

- **고객 지원 창구 개설**
  - 설정 페이지 하단에 '고객 지원' 섹션 추가
  - '문의하기' 모달을 통해 앱 내 의견 보내기 및 이메일 문의 바로가기 제공
  - React 19 `useActionState`를 활용한 서버 액션 기반 폼 처리 구현
- **데이터베이스 구축**
  - `feedbacks` 테이블 및 RLS 정책 생성

## 2026-02-09

### v0.4.7 - 자산 그래프 인터랙션 최적화

- **포트폴리오 차트 사용자 경험 개선**
  - 차트 배경 클릭 시 선택 해제 기능 추가 (직관적인 해제 동작)
  - 파이 조각 클릭 시 이벤트 전파(Propagation) 방지 처리로 반응 속도 및 정확도 향상

### v0.4.6 - 자산 포트폴리오 차트 인터랙션 개선

- **포트폴리오 차트 클릭 동작 수정**
  - 마우스 호버(`hover`)와 클릭 선택(`select`) 상태 로직 분리
  - 특정 항목 선택 상태에서 다른 항목 클릭 시 즉시 전환되도록 개선 (기존: 해제 후 재클릭 필요했던 문제 해결)
  - 동일 항목 재클릭 시 선택 해제 기능 유지

### v0.4.5 - 예산실적분석 UI 개선 및 자산 관리 동기화

- **예산실적분석 페이지 항목별 리스트 디자인 개선**
  - 자산 탭의 포트폴리오 레전드와 동일한 라운드 카드 스타일 적용
  - 항목별 고유 색상을 활용한 배경색 및 테두리 적용
  - 금액 표시 형식을 'OO만원', 'O.O억' 단위로 간소화하여 가독성 개선
  - 지출 항목별 비율(%) 표시 배지 추가

### v0.4.4 - 자산 차트 개선, 가계부 카테고리 상세, 카테고리 소프트 삭제

- **자산 포트폴리오 차트 개선**
  - Recharts Tooltip/activeShape 완전 제거 → 네모박스/검은 테두리 해결
  - 클릭 시 Total 아래에 한 줄로 자산 정보 표시
- **가계부 탭 카테고리별 상세 펼침**
  - 수입/지출 카드 클릭 시 카테고리별 목록 (비율 프로그레스바)
- **카테고리 삭제 소프트 삭제로 통합**
  - deleteCategory: 하드 삭제 → `is_hidden=true` (기본/커스텀 모두)
  - 설정 하단에 "삭제된 카테고리" 접이식 복원 섹션
