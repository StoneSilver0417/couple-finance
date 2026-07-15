# 작업 지시서: AI 보고서 진입점 이전 + 관리자 사용자 현황

> **대상**: Codex (또는 이 저장소에서 작업하는 모든 AI 코딩 도구)
> **작성**: 2026-07-15, Claude Code 설계 세션
> **베이스 규칙**: 저장소 루트 `AGENTS.md` + `D:\workspace\AGENTS.md`를 반드시 먼저 따를 것 — 한글 응답/주석, 서버 액션 입력 검증, React 19 setState-in-effect 금지, 완료 시 `handoff.md`/`CHANGELOG.md` 갱신, **새 npm 의존성 0개**.
> **선행 지식**: 월간 AI 보고서 기능(`/reports/[yearMonth]`)은 이미 구현·배포 완료 상태 (`docs/tasks/ai-monthly-report.md` 참고). 이번 작업은 그 진입점 이동 + 별개의 관리자 기능 추가다.

두 기능은 서로 독립적이다. **커밋을 분리**할 것.

---

## 기능 1 — AI 보고서 진입점을 분석 페이지로 이전 (커밋 1)

### 배경
현재 AI 월간 보고서 진입점이 설정 탭에 있는데, 사용자는 "가계부 탭 → 분석 페이지"에서 그 달을 본 맥락에서 보고서를 생성하길 원한다. yearMonth 형식은 두 페이지 모두 `YYYY-MM`으로 동일해 그대로 연결 가능.

### 1-1. `app/(app)/transactions/[yearMonth]/analysis/page.tsx` — 헤더 우측 버튼 추가

- 현재 헤더(102-122줄 부근)는 `flex items-center justify-between`인데 좌측 그룹만 있음. 좌측 `<div>`가 닫힌 뒤, `</header>` 직전에 버튼 추가.
- 스타일은 가계부 페이지 `app/(app)/transactions/[yearMonth]/page.tsx` 111-119줄의 "분석" 배지 버튼 패턴을 그대로 재사용 (`bg-primary/10 backdrop-blur-md border border-primary/20 rounded-2xl ...`), 아이콘은 `Sparkles`(lucide-react), 라벨 "AI 보고서".
- **미래월 클램프 (필수)**: reports 페이지는 미래월 접근 시 현재월로 redirect한다(`app/(app)/reports/[yearMonth]/page.tsx` 참고). 분석 페이지는 미래월 네비게이션이 자유로우므로, redirect에 맡기지 말고 **링크 생성 시점에 클램프**한다:

```tsx
// 컴포넌트 밖 헬퍼 — reports/[yearMonth]/page.tsx의 Asia/Seoul 현재월 계산 패턴 재사용
function getCurrentYearMonthSeoul(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul", year: "numeric", month: "numeric",
  }).formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  return `${y}-${String(m).padStart(2, "0")}`;
}

// 본문 — zero-padded YYYY-MM이므로 문자열 비교로 충분
const currentYearMonth = getCurrentYearMonthSeoul();
const reportYearMonth = yearMonth > currentYearMonth ? currentYearMonth : yearMonth;

// 헤더 우측
<Link href={`/reports/${reportYearMonth}`}>
  <Button
    variant="ghost"
    className="h-auto px-3 py-2 rounded-2xl bg-primary/10 backdrop-blur-md border border-primary/20 shadow-sm text-primary hover:bg-primary/20 transition-all hover:scale-105 flex items-center gap-1.5"
  >
    <Sparkles className="h-4 w-4" />
    <span className="text-xs font-bold">AI 보고서</span>
  </Button>
</Link>
```

### 1-2. `app/(app)/settings/page.tsx` — 그리드 항목 제거

- 메뉴 그리드 배열(216-274줄 부근)에서 "AI 월간 보고서" 항목(`href: /reports/${reportMonths.previous}`, `FileText` 아이콘) **객체 제거**. 나머지 항목과 map 렌더링은 무변경.
- `getReportMonths()`(27-40줄 부근)를 `getCurrentReportMonth(): string`으로 리네임·축소 — `previous` 계산 삭제, `current`만 반환. 호출부 2곳(변수 선언부, AiSettingsDialog `reportHref`) 갱신.
- `FileText` import 제거 (제거된 그리드 항목 전용이었음). `Bot`은 AI 키 카드에서 계속 사용하므로 유지.
- **AiSettingsDialog(키 관리 다이얼로그)와 그 안의 "이번 달 보고서 보러가기" 링크는 변경하지 말 것** — 설정에는 키 관리만 남기는 게 이번 작업의 의도.

### 커밋 1 완료 조건
- `npx tsc --noEmit`, `npx eslint .`, `npm run build` 통과 후 한글 conventional 커밋.

---

## 기능 2 — 관리자 사용자 현황 페이지 (커밋 2)

### 배경
관리자 페이지가 현재 피드백 확인(`/admin/feedbacks`)뿐이다. 사용자 현황(가입일·가구·역할)과 **마지막 접속**을 볼 수 있게 한다.
- 로그인 이력 테이블은 만들지 않는다 (사용자 결정). Supabase 인증이 자동 기록하는 `auth.users.last_sign_in_at`을 활용.
- `auth.users`는 anon 클라이언트로 못 읽으므로 **is_admin 체크를 내장한 SECURITY DEFINER RPC**로 조회한다. 서비스 롤 키는 도입하지 않는다 (이 프로젝트에 사용처 0 — 리스크 표면만 늘어남).

### 2-1. 마이그레이션 — `supabase/migrations/20260715100000_admin_user_overview.sql` (신규)

```sql
-- 관리자 전용 사용자 현황 조회 RPC
-- SECURITY DEFINER로 auth.users(last_sign_in_at)를 읽되, 함수 첫머리에서 is_admin을 강제
CREATE OR REPLACE FUNCTION public.admin_get_user_overview()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  household_id uuid,
  household_name text,
  role text,
  is_admin boolean,
  joined_at timestamptz,
  last_sign_in_at timestamptz,
  last_activity_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- 관리자 확인 (미인가 시 즉시 예외)
  IF COALESCE(
       (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
       FALSE
     ) IS NOT TRUE THEN
    RAISE EXCEPTION '관리자만 사용할 수 있습니다.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.email::text,
    p.full_name::text,
    p.household_id,
    h.name::text,
    p.role::text,
    p.is_admin,
    p.created_at,
    u.last_sign_in_at,
    a.max_created_at
  FROM public.profiles p
  LEFT JOIN public.households h ON h.id = p.household_id
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN LATERAL (
    SELECT MAX(al.created_at) AS max_created_at
    FROM public.activity_logs al
    WHERE al.user_id = p.id
  ) a ON TRUE
  ORDER BY u.last_sign_in_at DESC NULLS LAST, p.created_at DESC;
END;
$$;

-- 기본 PUBLIC EXECUTE 회수 후 authenticated에만 부여 (anon 호출 차단)
REVOKE ALL ON FUNCTION public.admin_get_user_overview() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_get_user_overview() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_get_user_overview() TO authenticated;
```

구현 시 주의:
- `SET search_path = ''` 때문에 본문 모든 객체가 스키마 한정(`public.`, `auth.`)돼 있어야 함 — 위 초안이 이미 그렇게 작성됨.
- plpgsql `RETURNS TABLE`의 출력 컬럼명이 변수처럼 취급되므로 본문 SELECT의 컬럼 참조는 **반드시 테이블 별칭으로 한정** (안 그러면 "column reference is ambiguous").
- `::text` 캐스팅은 varchar 컬럼과 RETURNS TABLE 타입 불일치("structure of query does not match") 예방용 — 그대로 유지.

> **🛑 사람 수동 단계 (Codex가 할 수 없음 — 사용자에게 요청하고 확인 후 진행)**:
> 이 SQL을 **사용자가 Supabase Dashboard(운영 `ieahmpxiaamesrnfgbng`) → SQL Editor에서 직접 실행**해야 한다. 실행 직후 같은 SQL Editor에서 `SELECT * FROM public.admin_get_user_overview();`를 실행하면 Dashboard 세션은 `auth.uid()`가 null이라 **"관리자만 사용할 수 있습니다" 예외가 나는 것이 정상**(미인가 차단 확인)이다. 실행 완료 확인 전에는 아래 런타임 검증이 전부 실패한다.

### 2-2. 타입 — `types/index.ts`에 추가

```ts
// 관리자 사용자 현황 RPC(admin_get_user_overview) 행 타입
export interface AdminUserOverviewRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  household_id: string | null;
  household_name: string | null;
  role: string | null;
  is_admin: boolean;
  joined_at: string;
  last_sign_in_at: string | null;
  last_activity_at: string | null;
}
```

### 2-3. 신규 페이지 — `app/(app)/admin/users/page.tsx`

- `app/(app)/admin/feedbacks/page.tsx` 구조를 복제: `isAdmin()`(`lib/admin-actions.ts`) 아니면 `redirect("/settings")`, sticky 헤더(뒤로가기 → `/settings`, 타이틀 "사용자 현황", "Admin Console" 라벨).
- **조회는 페이지 직쿼리** — `lib/admin-actions.ts`에 조회 함수를 추가하지 말 것 ("use server" export는 전부 공개 POST 엔드포인트가 되므로 최소화 규칙). 이중 방어 = 페이지 `isAdmin()` 게이트(1차) + RPC 내부 is_admin 체크(2차).

```tsx
const supabase = await createClient();
const { data, error } = await supabase.rpc("admin_get_user_overview");
if (error) throw error;
const rows = (data ?? []) as AdminUserOverviewRow[];
```

- **집계는 TS에서 파생 계산** (별도 RPC 없음): 총 사용자 = `rows.length`, 총 가구 = `new Set(household_id 비null).size`, 이번 달 신규 = `joined_at`의 Asia/Seoul 연-월이 현재 연-월과 같은 행 수. 연-월 계산은 `Intl.DateTimeFormat(..., { timeZone: "Asia/Seoul" }).formatToParts` 패턴으로(구분자 로케일 편차 방지 — `en-CA` format 문자열 조립에 의존하지 말 것).

### 2-4. 신규 컴포넌트 — `components/admin/` (셋 다 서버 컴포넌트, "use client" 불필요)

- `admin-nav.tsx`: `/admin/feedbacks` "피드백" · `/admin/users` "사용자" 2-pill 탭. `active: "feedbacks" | "users"` prop으로 활성 강조. glass-panel rounded-2xl 세그먼트 스타일. 두 관리자 페이지 헤더 바로 아래에 삽입.
- `user-overview-stats.tsx`: `grid grid-cols-3 gap-3` 집계 카드 3장 (총 사용자 `Users` / 총 가구 `Home` / 이번 달 신규 `UserPlus`).
- `user-overview-list.tsx`: **테이블 대신 카드 리스트** (모바일 우선 — 이 앱의 다른 목록 UI와 일관). 카드 구성:
  - 상단: 이름(없으면 이메일 앞부분) + 배지 — `is_admin`이면 "ADMIN"(파랑), `role === "OWNER"`면 "가구장" 소형 pill
  - 이메일(truncate), 가구명(없으면 "가구 미설정")
  - 하단 메타 3줄: 가입일(날짜만) / 마지막 로그인 / 마지막 활동 — `Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", ... })` (reports 페이지의 날짜 포맷 패턴 참고), null이면 "기록 없음"
  - 정렬은 RPC 반환 순서(last_sign_in_at DESC) 그대로

### 2-5. 기존 파일 수정 2곳

- `app/(app)/admin/feedbacks/page.tsx`: 헤더 아래 `<AdminNav active="feedbacks" />` 삽입만.
- `app/(app)/settings/page.tsx` 관리자 카드(335-373줄 부근): 링크는 `/admin/feedbacks` 유지(미답변 배지와 자연 연결), 설명 텍스트만 "피드백 답변 · 사용자 현황 관리"로 갱신.

---

## 검증 체크리스트

1. [ ] `npx tsc --noEmit` 통과
2. [ ] `npx eslint .` 0 오류 0 경고
3. [ ] `npm run build` 성공
4. [ ] **(사람) SQL Editor에서 2-1 마이그레이션 실행** + Dashboard 세션에서 직접 SELECT 시 "관리자만..." 예외 확인(정상)
5. [ ] 분석 페이지(`/transactions/{현재월}/analysis`) 헤더 우측 "AI 보고서" 버튼 → `/reports/{현재월}` 이동
6. [ ] 분석 페이지에서 다음달로 이동 후 버튼 클릭 → 현재월 보고서로 이동 (클램프 동작, redirect 튕김 없음)
7. [ ] `/settings`에서 "AI 월간 보고서" 그리드 항목 사라짐 + AI 키 다이얼로그의 "보고서 보러가기" 링크는 정상 동작
8. [ ] 관리자 계정 로그인 → `/admin/users`: 집계 3종 + 사용자 카드(마지막 로그인 표시) 렌더, `/admin/feedbacks` ↔ `/admin/users` 탭 이동
9. [ ] 비관리자 계정 → `/admin/users` 직접 접근 시 `/settings` redirect
10. [ ] (선택) 비관리자 세션으로 RPC 직접 호출(`POST /rest/v1/rpc/admin_get_user_overview`) → "관리자만..." 에러, anon(Authorization 없이) → 권한 거부 확인
11. [ ] `handoff.md`·`CHANGELOG.md` 갱신, 커밋 2개(기능별 분리), 한글 conventional 커밋 메시지

## 참고 패턴 파일 (구현 전 읽을 것)

| 패턴 | 파일 |
|---|---|
| "분석" 배지 버튼 스타일 | `app/(app)/transactions/[yearMonth]/page.tsx` 111-119줄 |
| Asia/Seoul 현재월 계산, ko-KR 날짜 포맷 | `app/(app)/reports/[yearMonth]/page.tsx` |
| 관리자 페이지 구조 (게이트/sticky 헤더) | `app/(app)/admin/feedbacks/page.tsx` |
| isAdmin() 게이트 | `lib/admin-actions.ts` |
| is_admin 체크 SQL 패턴 | `supabase/migrations/20260212000001_db_optimization.sql` 71-85줄 |
| SECURITY DEFINER RPC 선례 | `supabase/migrations/20260212000000_security_rpc_fix.sql` |
| glass-panel 카드/리스트 UI | `app/(app)/assets/assets-page-client.tsx`, `components/admin/feedback-admin-list.tsx` |

## 리스크 메모

- RPC 실행 전 `/admin/users` 접근 시 `supabase.rpc`가 "function does not exist" 에러 → 페이지가 throw하므로 마이그레이션 실행이 선행돼야 함 (검증 4번이 5~10번보다 먼저).
- `auth.users` 조인은 SECURITY DEFINER이므로 함수 소유자가 `auth` 스키마 읽기 권한을 가진 역할(postgres)이어야 함 — Dashboard SQL Editor에서 실행하면 기본 충족.
- 분석 페이지 미래월 클램프는 문자열 비교(`"2026-08" > "2026-07"`) — zero-padded 전제라 안전하나, 헬퍼가 만드는 값에 반드시 `padStart(2, "0")` 유지.
