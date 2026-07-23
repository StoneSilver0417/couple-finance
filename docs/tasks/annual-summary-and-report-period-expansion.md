# 작업 지시서: 연간 요약 페이지 (Phase 1) + AI 월간 보고서 기간 확장 설계 (Phase 2)

> **대상**: Codex (또는 이 저장소에서 작업하는 모든 AI 코딩 도구)
> **작성**: 2026-07-23, Claude Code 설계 세션
> **베이스 규칙**: 저장소 루트 `AGENTS.md`를 반드시 먼저 따를 것 — 한글 응답/주석, 서버 액션 입력 검증 필수, React 19 setState-in-effect 금지, 예산 사용률은 `calculateBudgetUsagePercent()`(변동지출 기준)만 사용, 관리자 권한은 `profiles.is_admin`만.
> **새 npm 의존성 0개** — Phase 1은 기존 Recharts 기반 컴포넌트를 그대로 재사용한다.
> **Phase 상태**: **Phase 1은 지금 바로 착수.** Phase 2는 설계만 확정된 상태이며, **사용자가 이 문서를 다시 지목해 명시적으로 요청할 때만 착수한다.** 이번 세션에서 Phase 2 코드는 작성하지 않는다.

---

## Phase 1 — 연간 요약 페이지 (지금 착수)

### 1. 배경

가계부 사용자가 12개월치 수입/지출 추이와 카테고리별 지출 비중을 한눈에 보고 싶어한다. **조회 전용** — 연간 예산 목표를 별도로 입력하는 기능은 이번 범위에 없다 (기존 월별 예산 12개를 합산해서 보여주는 것으로 충분).

### 2. 핵심 설계 결정 (실제 코드로 검증 완료 — 임의 변경 금지)

1. **라우트**: `app/(app)/transactions/annual/[year]/page.tsx` → URL `/transactions/annual/2026`. "가계부" 탭(`/transactions`) 하위에 둔다 — 자산 통계는 `/assets`, 가계 통계는 `/transactions` 계열이라는 기존 정보 구조를 따른다. 정적 세그먼트 `annual`이 동적 `[yearMonth]`와 같은 depth에 있어도 Next.js App Router가 안전하게 구분하므로 `/transactions/[yearMonth]`, `/transactions/[yearMonth]/analysis`와 충돌 없다.
2. **신규 마이그레이션 없음.** `monthly_balances`(연간 12개월 income/expense 합), `monthly_budgets`(12개월 총예산 합산), `get_transactions_by_month` RPC(연초~연말 범위 — 이름과 달리 임의 날짜범위를 지원함이 코드로 확인됨)로 전부 충분하다.
3. **새 클라이언트 래퍼를 만들지 않는다.** 자산 페이지(`assets-page-client.tsx`)가 별도 `"use client"` 래퍼를 갖는 이유는 필터 탭(`activeFilterId`) 상태를 여러 섹션이 공유해야 하기 때문이다. 연간 페이지는 연도 이동이 순수 링크 기반이라 그런 공유 상태가 없다 — 대신 **대시보드(`app/(app)/page.tsx`)와 동일한 패턴**을 따른다: 서버 컴포넌트가 직접 조회·집계하고, 이미 `"use client"`인 기존 차트 컴포넌트에 결과를 props로 바로 내려준다.
4. **차트는 100% 재사용, 신규 차트 컴포넌트 0개.**
   - 월별 추이(수입/지출 토글): `components/dashboard/expense-trend-section.tsx`의 `ExpenseTrendSection`을 그대로 import — `{date,label,value}[]` 2세트(`expenseData`, `incomeData`)를 받아 토글 UI까지 자체 처리한다. **검증됨**: 두 배열 모두 길이 2 미만이면 자동으로 `null`을 반환하므로 별도 방어 코드가 필요 없다.
   - 카테고리별 연간 지출 비중(도넛): `components/charts/asset-portfolio-chart.tsx`의 `AssetPortfolioChart`를 그대로 import — `{name,value,color}[]`만 받는 범용 도넛 차트라(자산 전용 로직 없음) 카테고리 집계 데이터를 그대로 꽂을 수 있다.
   - 요약 카드: `components/reports/report-view.tsx`에 정의된 (현재 export 안 된) `StatCard`에 `export` 키워드만 추가해 재사용한다. **검증된 props**: `{ label: string; value: string; icon: typeof BanknoteArrowDown; tone: string; valueTone?: string; cardTone?: string }`. 동작 변경 없는 1줄짜리 안전한 수정이다.
5. **예산 사용률은 기존 규칙 그대로**: 연간 `monthly_budgets.total_budget` 합계 대비 연간 변동지출(`expense_type='variable'`) 합계 — `calculateBudgetUsagePercent(totalBudget, variableExpense)`(`lib/calculations/finance.ts`, **시그니처 검증됨**: `(totalBudget: number, variableExpense: number): number | null`, `totalBudget <= 0`이면 `null`) 재사용. 고정·비정기 지출 제외.
6. **카테고리 집계 헬퍼는 새 페이지 파일 내부에 로컬로 구현한다.** `report-actions.ts`의 `aggregateExpenseCategories`류는 `"use server"` 파일 안에 있고 export되지 않아 import가 불가능하다. 로직은 15줄 내외로 가볍고, 이미 배포되어 안정적으로 동작 중인 `report-actions.ts`를 건드리는 리스크보다 이 정도 중복을 감수하는 편이 안전하다는 판단이다. (나중에 원한다면 `lib/calculations/finance.ts`로 공통 추출 가능 — 이번 지시서 범위 아님.)

### 3. 참고할 기존 패턴 파일 (구현 전 반드시 읽을 것)

| 패턴 | 파일 |
|---|---|
| 기간 라우트 검증 + 네비게이션 + Asia/Seoul 현재월/연도 계산 | `app/(app)/reports/[yearMonth]/page.tsx` |
| 연도만 검증하는 트릭 (`isValidYearMonth(year, 1)` — 2000~2100 범위 체크, month=1 고정이라 항상 통과) | `lib/validation.ts` |
| monthly_balances 조회 → 추이 데이터 매핑 | `app/(app)/page.tsx` (79~86, 138~149행) |
| RPC 임의 날짜범위 호출 + `year` 파싱 위치 | `app/(app)/transactions/[yearMonth]/analysis/page.tsx` (63~67행 RPC 호출, 50행에서 `const [year, month] = yearMonth.split("-").map(Number);`로 이미 파싱됨) |
| `TransactionRpcRow` 타입 (검증됨: `type`, `amount`, `category_name`, `category_color` 필드 존재) | `types/index.ts` 65~76행 |
| 예산 사용률 공통 함수 | `lib/calculations/finance.ts` `calculateBudgetUsagePercent` |
| 월별 추이 토글 컴포넌트 (그대로 재사용) | `components/dashboard/expense-trend-section.tsx` |
| 범용 도넛 차트 (그대로 재사용) | `components/charts/asset-portfolio-chart.tsx` |
| 요약 카드 (export 추가 후 재사용) | `components/reports/report-view.tsx` `StatCard` (102행 부근) |
| glass-panel 카드/헤더/기간 네비 UI 톤 | `app/(app)/assets/assets-page-client.tsx` |
| 분석 페이지 헤더 우측 버튼 (진입점 통합 지점, 117~147행) | `app/(app)/transactions/[yearMonth]/analysis/page.tsx` |

### 4. 구현 단계 (커밋 단위 제안)

#### 단계 1: `components/reports/report-view.tsx`의 `StatCard`를 export

```ts
// 102행 근처, 동작 변경 없이 export만 추가
export function StatCard({ ... }: { ... }) { ... }
```

#### 단계 2: 신규 페이지 — `app/(app)/transactions/annual/[year]/page.tsx`

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CircleDollarSign,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { calculateBudgetUsagePercent } from "@/lib/calculations/finance";
import { isValidYearMonth } from "@/lib/validation";
import { StatCard } from "@/components/reports/report-view";
import ExpenseTrendSection from "@/components/dashboard/expense-trend-section";
import AssetPortfolioChart from "@/components/charts/asset-portfolio-chart";
import type { TransactionRpcRow } from "@/types";

const CATEGORY_FALLBACK_COLOR = "#cbd5e1";

function getCurrentYearSeoul(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(new Date());
  return Number(parts.find((p) => p.type === "year")?.value);
}

function getCurrentMonthSeoul(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    month: "numeric",
  }).formatToParts(new Date());
  return Number(parts.find((p) => p.type === "month")?.value);
}

interface AnnualCategoryAggregate {
  name: string;
  value: number;
  color: string;
}

function aggregateAnnualCategories(
  rows: TransactionRpcRow[],
): AnnualCategoryAggregate[] {
  const groups = new Map<string, AnnualCategoryAggregate>();
  for (const row of rows) {
    if (row.type !== "expense") continue;
    const name = row.category_name || "미분류";
    const amount = Number(row.amount) || 0;
    const existing = groups.get(name);
    if (existing) {
      existing.value += amount;
    } else {
      groups.set(name, {
        name,
        value: amount,
        color: row.category_color || CATEGORY_FALLBACK_COLOR,
      });
    }
  }
  const sorted = Array.from(groups.values()).sort((a, b) => b.value - a.value);
  if (sorted.length <= 8) return sorted;
  const rest = sorted.slice(7).reduce((sum, item) => sum + item.value, 0);
  return [
    ...sorted.slice(0, 7),
    { name: "기타", value: rest, color: CATEGORY_FALLBACK_COLOR },
  ];
}

export default async function AnnualSummaryPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearParam } = await params;
  const year = Number(yearParam);
  const currentYear = getCurrentYearSeoul();

  if (
    !/^\d{4}$/.test(yearParam) ||
    !isValidYearMonth(year, 1) || // 연도 범위(2000~2100) 검증 재사용
    year > currentYear
  ) {
    redirect(`/transactions/annual/${currentYear}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();
  if (!profile?.household_id) redirect("/onboarding");

  const [balancesResult, budgetsResult, transactionsResult] = await Promise.all([
    supabase
      .from("monthly_balances")
      .select("month, income_total, expense_total")
      .eq("household_id", profile.household_id)
      .eq("year", year)
      .order("month", { ascending: true }),
    supabase
      .from("monthly_budgets")
      .select("total_budget")
      .eq("household_id", profile.household_id)
      .eq("year", year),
    supabase.rpc("get_transactions_by_month", {
      p_household_id: profile.household_id,
      p_start_date: `${year}-01-01`,
      p_end_date: `${year}-12-31`,
    }),
  ]);

  const monthsInYear =
    year === currentYear ? getCurrentMonthSeoul() : 12; // 올해면 이번 달까지만(미래 0원 데이터 방지)
  const balanceByMonth = new Map(
    (balancesResult.data ?? []).map((row) => [row.month, row]),
  );

  const expenseTrend = Array.from({ length: monthsInYear }, (_, i) => {
    const month = i + 1;
    const row = balanceByMonth.get(month);
    return {
      date: `${year}-${String(month).padStart(2, "0")}`,
      label: `${month}월`,
      value: Number(row?.expense_total) || 0,
    };
  });
  const incomeTrend = Array.from({ length: monthsInYear }, (_, i) => {
    const month = i + 1;
    const row = balanceByMonth.get(month);
    return {
      date: `${year}-${String(month).padStart(2, "0")}`,
      label: `${month}월`,
      value: Number(row?.income_total) || 0,
    };
  });

  const totalIncome = (balancesResult.data ?? []).reduce(
    (sum, r) => sum + (Number(r.income_total) || 0),
    0,
  );
  const totalExpense = (balancesResult.data ?? []).reduce(
    (sum, r) => sum + (Number(r.expense_total) || 0),
    0,
  );
  const totalBudget = (budgetsResult.data ?? []).reduce(
    (sum, r) => sum + (Number(r.total_budget) || 0),
    0,
  );

  const transactionRows = (transactionsResult.data ?? []) as TransactionRpcRow[];
  const variableExpense = transactionRows
    .filter((r) => r.type === "expense" && r.expense_type === "variable")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const budgetUsagePercent = calculateBudgetUsagePercent(totalBudget, variableExpense);
  const annualCategories = aggregateAnnualCategories(transactionRows);

  const prevYear = year - 1;
  const nextYear = year + 1;
  const nextDisabled = nextYear > currentYear;

  return (
    <div className="flex-1 w-full animate-fade-in pb-8">
      <header className="flex items-center gap-4 p-6 pt-10">
        <Link href="/transactions">
          <Button
            variant="ghost"
            size="icon"
            aria-label="가계부로 돌아가기"
            className="group rounded-full bg-white/60 shadow-soft hover:bg-white"
          >
            <ArrowLeft className="h-5 w-5 text-text-main group-hover:-translate-x-0.5 transition-transform" />
          </Button>
        </Link>
        <div>
          <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-text-secondary">
            Annual Summary
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-text-main">
            연간 요약 <CalendarRange className="h-5 w-5 text-primary" />
          </h1>
        </div>
      </header>

      <div className="px-6 space-y-6">
        {/* 연도 네비게이션 */}
        <nav
          aria-label="연도 이동"
          className="glass-panel flex items-center justify-between rounded-2xl border border-white/60 p-2 shadow-sm"
        >
          <Link href={`/transactions/annual/${prevYear}`}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="이전 연도"
              disabled={!isValidYearMonth(prevYear, 1)}
              className="rounded-xl hover:bg-white/60"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <span className="font-black text-text-main">{year}년</span>
          {nextDisabled ? (
            <Button
              variant="ghost"
              size="icon"
              disabled
              aria-label="다음 연도 없음"
              className="rounded-xl"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          ) : (
            <Link href={`/transactions/annual/${nextYear}`}>
              <Button
                variant="ghost"
                size="icon"
                aria-label="다음 연도"
                className="rounded-xl hover:bg-white/60"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </nav>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="연간 수입"
            value={`${totalIncome.toLocaleString()}원`}
            icon={BanknoteArrowDown}
            tone="bg-emerald-50 text-emerald-600"
            valueTone="text-emerald-700"
            cardTone="border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white"
          />
          <StatCard
            label="연간 지출"
            value={`${totalExpense.toLocaleString()}원`}
            icon={BanknoteArrowUp}
            tone="bg-rose-50 text-rose-600"
            valueTone="text-rose-700"
            cardTone="border-rose-100 bg-gradient-to-br from-rose-50/80 to-white"
          />
          <StatCard
            label="연간 잔액"
            value={`${(totalIncome - totalExpense).toLocaleString()}원`}
            icon={CircleDollarSign}
            tone="bg-blue-50 text-blue-600"
          />
          {budgetUsagePercent !== null && (
            <StatCard
              label="예산 사용률"
              value={`${budgetUsagePercent.toFixed(1)}%`}
              icon={Gauge}
              tone="bg-violet-50 text-violet-600"
            />
          )}
        </div>

        {/* 월별 추이 — 기존 컴포넌트 그대로 재사용 */}
        <ExpenseTrendSection expenseData={expenseTrend} incomeData={incomeTrend} />

        {/* 카테고리별 비중 — 기존 도넛 차트 그대로 재사용 */}
        {annualCategories.length > 0 && (
          <div className="glass-panel p-5 rounded-[2rem] border border-white/60">
            <h3 className="text-lg font-bold text-text-main mb-4 px-2">
              카테고리별 지출 비중
            </h3>
            <AssetPortfolioChart data={annualCategories} />
          </div>
        )}
      </div>

      <div className="h-24" />
    </div>
  );
}
```

> `ExpenseTrendSection`은 `expenseData`/`incomeData` 둘 다 길이 2 미만이면 `null`을 반환하므로(자체 방어) 1월 같은 데이터 부족 상황에 대한 별도 처리가 필요 없다.

#### 단계 3: 진입점 추가 — `app/(app)/transactions/[yearMonth]/analysis/page.tsx` (117~147행)

기존 헤더의 "AI 보고서" 단일 `<Link>` 버튼을 두 버튼을 감싸는 flex 컨테이너로 바꾸고, "연간 요약" 버튼을 추가한다. `year`는 50행에서 이미 `const [year, month] = yearMonth.split("-").map(Number);`로 파싱돼 있으므로 추가 계산이 필요 없다.

```tsx
<div className="flex items-center gap-2">
  <Link href={`/transactions/annual/${year}`}>
    <Button
      variant="ghost"
      className="h-auto px-3 py-2 rounded-2xl bg-white/60 border border-white/60 shadow-sm text-text-main hover:bg-white flex items-center gap-1.5"
    >
      <CalendarRange className="h-4 w-4" aria-hidden="true" />
      <span className="text-xs font-bold">연간 요약</span>
    </Button>
  </Link>
  <Link href={`/reports/${reportYearMonth}`}>
    {/* 기존 AI 보고서 버튼 내용 그대로 유지 */}
  </Link>
</div>
```

`lucide-react` import(5행)에 `CalendarRange` 추가.

### 5. 검증 체크리스트 (Phase 1)

1. [ ] `npx tsc --noEmit` 통과
2. [ ] `npx eslint .` 0 오류 0 경고
3. [ ] `npm run build` 성공
4. [ ] `/transactions/annual/2026` 접속 → 요약 카드/월별 추이/카테고리 도넛 정상 렌더
5. [ ] 잘못된 연도(`/transactions/annual/abcd`, `/transactions/annual/1999`) → 현재 연도로 redirect
6. [ ] 미래 연도(`/transactions/annual/2027`) → 현재 연도로 redirect
7. [ ] 연도 네비게이션 이전/다음 버튼 동작, 다음 연도(미래) 비활성화 확인
8. [ ] 거래/예산이 없는 연도 → 에러 없이 빈 상태로 렌더(도넛/예산카드 미표시)
9. [ ] 분석 페이지 헤더에서 "연간 요약" 버튼으로 진입 확인
10. [ ] `handoff.md`·`CHANGELOG.md` 갱신, 한글 conventional 커밋

### 6. 리스크 메모 (Phase 1)

- `get_transactions_by_month`에 연초~연말 범위를 통째로 넘기면 활발한 가구는 연간 수백~수천 건이 한 번에 응답으로 온다. 응답이 느리면 12개월 병렬 호출로 쪼개는 것도 대안이지만, 왕복 12회보다 1회 요청이 보통 더 빠르므로 기본안은 단일 범위 호출로 유지하고 실측 후 필요시 조정한다.
- `monthly_balances` 합계(캐시)와 트랜잭션 기반 `variableExpense` 합계(RPC 실시간 집계)는 소스가 달라 이론상 근소한 차이가 날 수 있다(동기화 지연 등). 실제로는 `syncMonthlyBalance`가 거래 CRUD마다 갱신하므로 거의 항상 일치하지만, 요약 카드(총수입/총지출)와 예산 카드(변동지출 기반)의 계산 출처가 다르다는 점은 인지할 것.

---

## Phase 2 — AI 보고서 기간 확장 (설계 확정, 착수는 나중)

> **주의**: 아래는 상세 설계이며 지금 구현하지 않는다. Codex는 사용자가 "Phase 2 착수" 또는 이 문서를 다시 지목해 명시적으로 요청할 때만 진행한다.

### 1. 스키마 변경안: 신규 테이블 `periodic_reports` 분리 (기존 `monthly_reports` 확장 아님)

**옵션 A(기각) — `monthly_reports` 확장**: `month`를 nullable로, `period_type`(`'month'|'quarter'|'half'|'year'`) + `period_key`(TEXT, 예: `"2026-07"`,`"2026-Q1"`,`"2026-H1"`,`"2026"`) 컬럼을 추가하고 `UNIQUE(household_id, year, month)` → `UNIQUE(household_id, period_type, period_key)`로 교체.

**옵션 B(채택) — 신규 테이블 `periodic_reports` 분리**: `monthly_reports`는 완전히 그대로 두고, 분기/반기/연간만 담는 새 테이블을 추가.

**채택 근거**: `monthly_reports`는 **이미 배포되어 실사용자 데이터가 쌓인 라이브 테이블**이다. `lib/report-actions.ts`와 `app/(app)/reports/[yearMonth]/page.tsx`가 지금도 `year`/`month` 컬럼에 직접 `.eq()`를 건다. 옵션 A는 `month NOT NULL CHECK(1~12)` 제약을 조건부로 바꿔야 하고, 기존 row의 `period_type='month'`/`period_key` 백필이 필요하며, 이미 동작 중인 두 파일의 쿼리를 전부 고쳐야 한다 — 잘 동작하는 기능에 회귀 리스크를 얹는 셈이다. 옵션 B는 새 테이블만 추가하므로 월간 보고서 경로는 **1바이트도 건드리지 않는다.**

```sql
-- Phase 2 초안 — 지금 실행하지 않음. Phase 2 착수 시점에 재검토 후 사용자가 Supabase Dashboard SQL Editor에서 직접 실행.
CREATE TABLE periodic_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('quarter', 'half', 'year')),
  year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  period_key TEXT NOT NULL, -- '2026-Q1' | '2026-H1' | '2026'
  content JSONB NOT NULL,
  model TEXT NOT NULL,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(household_id, period_type, period_key)
);
ALTER TABLE periodic_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage household periodic reports" ON periodic_reports
  FOR ALL USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));
```

`period_key` 형식 검증 정규식(서버 액션에서 사용):
- quarter: `/^\d{4}-Q[1-4]$/`
- half: `/^\d{4}-H[1-2]$/`
- year: `/^\d{4}$/`

### 2. 날짜 범위 계산 일반화

`lib/report-actions.ts`의 `getMonthRange(year, month)`을 참고해 `getPeriodRange(periodType, periodKey)`를 신설(같은 파일 또는 신규 `lib/period-range.ts`):

- `quarter Qn`: 시작 = `new Date(year, (n-1)*3, 1)`, 종료 = `new Date(year, n*3, 0)`
- `half H1/H2`: H1 = 1~6월, H2 = 7~12월 (동일한 방식)
- `year`: 1/1 ~ 12/31

전기간 대비 계산:
- quarter: Q1 → 전년 Q4, 그 외 → 같은 해 Q-1
- half: H1 → 전년 H2, H2 → 같은 해 H1
- year: 전년 동일 연도 전체

### 3. 집계/타입 확장 — 필드명은 그대로 유지, 라벨만 동적으로

**중요 결정**: `ReportStats.momCategoryDiffs`, `GeminiReportAggregates.monthOverMonthHighlights`, AI 응답의 `momComments` 같은 필드명을 `periodCategoryDiffs` 등으로 "정확하게" 리네임하고 싶은 유혹이 있지만 **하지 않는다.** 이미 배포된 `monthly_reports.content` JSONB에는 옛 필드명으로 데이터가 저장돼 있고, `components/reports/report-view.tsx`가 그 문자열 키를 직접 읽는다. 필드명을 바꾸면 기존에 생성된 월간 보고서가 화면에서 깨진다(하위호환 파괴). 따라서:

- `ReportStats`/`GeminiReportAggregates`/`ReportAiContent`의 키 이름은 그대로 둔다.
- 대신 `periodLabel`(예: "이번 분기", "이번 반기", "올해")과 `previousPeriodLabel`(예: "전분기", "전반기", "작년") 문자열을 새 필드로 추가해 Gemini 프롬프트와 `ReportView`에 주입, "전월" 하드코딩 문구를 이 값으로 대체한다.
- `lib/ai/gemini.ts`의 `reportResponseSchema` 설명 문구("이번 달", "전월")도 `periodLabel`/`previousPeriodLabel`을 반영하도록 시스템 인스트럭션에서 치환.

### 4. UI 확장

`app/(app)/reports/[yearMonth]/page.tsx` → `app/(app)/reports/[period]/page.tsx`로 폴더 리네임(파라미터 이름만 바뀌므로 기존 `/reports/2026-07` URL은 그대로 동작 — 하위호환 유지).

`period` 파싱 캐스케이드:
```
/^(\d{4})-(\d{2})$/   → month  (기존)
/^(\d{4})-Q([1-4])$/  → quarter
/^(\d{4})-H([1-2])$/  → half
/^(\d{4})$/           → year
```

상단에 기간 유형 탭(월/분기/반기/연간) 추가 — `assets-page-client.tsx`의 `TREND_PERIOD_OPTIONS` 버튼 그룹 스타일 재사용. 탭 전환 시 오늘 날짜 기준으로 해당 period_key를 계산해 `router.push`.

서버 액션은 `generateMonthlyReport` 옆에 `generatePeriodicReport(prevState, formData)`를 신설(기존 액션은 건드리지 않음) — `periodType`+`periodKey`를 받아 `getPeriodRange`로 당기간/전기간 계산 후 `periodic_reports` upsert(`onConflict: "household_id,period_type,period_key"`). `period_type='month'`인 경우는 계속 기존 `generateMonthlyReport`/`monthly_reports` 경로를 그대로 사용(라우트 페이지에서 분기).

### 5. Gemini 프롬프트/스키마 조정 포인트

- `categoryExpenses`/`highExpenses`의 상위 N개수(현재 8/5)는 연간처럼 기간이 길수록 항목이 많아지므로 기간별로 조정 가능한 파라미터로 뺀다(quarter=8, half=10, year=12 등 튜닝 여지).
- `monthlyTrend`(현재 6개월 고정)도 기간별로 window를 조정(연간 보고서라면 최근 12개월이 더 적절).
- 시스템 인스트럭션의 "월간 분석 도우미", "이번 달"류 하드코딩 문구를 `periodLabel` 삽입 방식으로 파라미터화.

### 6. Phase 2 진행 순서 요약 (착수 시점에 참고)

1. `periodic_reports` 마이그레이션 SQL 작성 + 🛑 사람이 Supabase Dashboard에서 수동 실행
2. `getPeriodRange` 유틸 추가
3. `ReportStats`/`GeminiReportAggregates`에 `periodLabel`/`previousPeriodLabel` 필드 추가(기존 필드는 무변경)
4. `generatePeriodicReport` 서버 액션 신규(기존 `generateMonthlyReport`는 그대로 유지)
5. `/reports/[yearMonth]` → `/reports/[period]` 라우트 리네임 + 기간 탭 UI
6. `ReportView`에 `periodLabel` prop 추가해 "이번 달"류 하드코딩 텍스트 대체
7. 검증: 기존 월간 보고서(하위호환) + 신규 분기/반기/연간 각각 생성·재생성 E2E

## 참고 패턴 파일 (Phase 2)

- `lib/report-actions.ts` — `getMonthRange`, `generateMonthlyReport` 전체 구조
- `lib/ai/gemini.ts` — `reportResponseSchema`, 시스템 인스트럭션
- `components/reports/report-view.tsx` — `momCategoryDiffs` 등 필드 소비 지점
- `app/(app)/assets/assets-page-client.tsx` — 기간 탭 버튼 그룹 스타일
