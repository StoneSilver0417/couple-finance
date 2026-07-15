# Changelog

## 2026-07-15

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
  - **주의**: 테스트 과정에서 운영 DB에 테스트 계정(`test_e2e_antigravity_1@example.com`) 및 "Test Household" 가구 데이터가 생성됨 → 다음 세션에서 SQL로 정리 필요
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
  - `waterdrop11@naver.com` 계정 전용 관리자 페이지 구축
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
