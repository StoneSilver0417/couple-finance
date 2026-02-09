**[Gemini 3 Pro: Final Phase - Developer Handoff]**

수고하셨습니다. 이제 3단계 프로세스의 마지막 단계인 **[3단계: 개발자 핸드오프 최적화 (Developer Ready)]**에 도달했습니다.

사용자님의 마지막 요청 사항인 **"자산 탭의 필터(남편/아내/자녀)가 실제 존재할 때만 조건부로 노출되는 로직"**을 포함하여, **AI 코딩 도구(Claude Code, Cursor)나 개발자가 보고 즉시 코딩을 시작할 수 있는 최종 확정본(v2.0)**을 작성했습니다.

이 문서는 모호함을 제거하고, **데이터 구조, 폴더 트리, 상태 관리 전략, 핵심 로직**을 엔지니어링 레벨로 정의했습니다.

---

# PRD: 부부 공동 가계부 (Final v2.0 - Developer Ready)

## 1. 프로젝트 개요 (Overview)

### 1.1 프로젝트 정보

- **프로젝트명**: Couple Finance Tracker (부부 공동 가계부)
- **플랫폼**: Web Application (PWA 지원)
- **핵심 목표**: 부부의 자금 흐름(Flow)과 자산(Stock)을 명확히 분리하고, 달력 뷰와 심층 자산 분석을 통해 재정 투명성을 확보한다.

### 1.2 기술 스택 (Tech Stack)

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + `shadcn/ui` (Components)
- **Animation**: Framer Motion
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **State Management**: Zustand (Global UI State), React Query (Server State)
- **Charts**: Recharts
- **Calendar**: `react-calendar` (Custom Styled)

## 2. 핵심 비즈니스 로직 & UX 흐름

### 2.1 메인 대시보드 (Dashboard)

- **지출 분석 (Top)**: 이번 달 총 지출 및 카테고리별 상위 지출 표시.
- **자산 요약 (Middle)**: 총 순자산(Net Worth) 표시 및 클릭 시 자산 탭 이동.
- **활동 로그 (Notification)**: 우측 상단 벨 아이콘 클릭 시 `Activity Log` 바텀 시트 노출.

### 2.2 가계부 (Transactions) - Calendar View

- **뷰 모드**: 리스트가 아닌 **월간 달력**이 기본.
- **입력 UX**: 날짜 셀(Cell)을 클릭하여 거래 입력 모달 실행. (+ 버튼 없음)
- **데이터 표현**: 날짜 셀 내에 `수입(Blue Dot)`, `지출(Red Text)` 요약 표시.

### 2.3 자산 관리 (Assets) - Dynamic Filter & Charts

- **조건부 탭 렌더링 (Critical Requirement)**:
  - **전체(All)**, **공동(Joint)**: 항상 표시.
  - **배우자(Spouse)**: 가구 구성원이 2명일 때만 표시.
  - **자녀(Child)**: `assets` 테이블에 `owner_type='CHILD'`인 데이터가 1개 이상 존재할 때만 표시.
- **동적 차트**: 선택된 탭에 따라 도넛 차트(포트폴리오)와 라인 차트(추이)가 해당 필터 데이터로 리렌더링됨.

## 3. 데이터베이스 스키마 (Database Schema)

### 3.1 Tables (Supabase SQL)

```sql
-- 1. Households & Profiles
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE, -- 초대 코드 (유효기간 로직은 App Level에서 처리 권장)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id),
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'MEMBER', -- 'OWNER' | 'MEMBER'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Transactions (가계부)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL, -- 캘린더 매핑용
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12, 2) NOT NULL,
  category_id UUID REFERENCES categories(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  memo TEXT,

  -- Audit Trail
  created_by UUID REFERENCES auth.users(id),
  last_modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'income' | 'expense'
  icon TEXT,
  color TEXT,
  is_hidden BOOLEAN DEFAULT FALSE
);

-- 4. Assets (자산)
CREATE TYPE asset_owner_type AS ENUM ('JOINT', 'INDIVIDUAL', 'CHILD');

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'CASH', 'BANK', 'STOCK', 'REAL_ESTATE', 'DEBT'
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Ownership Logic
  owner_type asset_owner_type NOT NULL DEFAULT 'JOINT',
  owner_profile_id UUID REFERENCES profiles(id), -- INDIVIDUAL일 때 소유자 ID
  child_name TEXT, -- CHILD일 때 자녀 이름 (UI 표시용)

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Asset History (시각화용 스냅샷)
CREATE TABLE asset_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  total_net_worth DECIMAL(12, 2) NOT NULL,

  -- 필터링된 그래프를 그리기 위한 JSON 데이터
  -- { "joint": 100, "user_a": 50, "user_b": 50, "child": 10 }
  breakdown_data JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, record_date)
);

-- 6. Activity Logs (활동 기록)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  target_table TEXT NOT NULL, -- 'TRANSACTION', 'ASSET', 'BUDGET'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 RLS Policies (Security)

모든 테이블은 `household_id`를 기준으로 격리되어야 합니다.

```sql
-- Example Policy for Transactions
CREATE POLICY "Household Isolation" ON transactions
USING (household_id IN (
  SELECT household_id FROM profiles WHERE id = auth.uid()
));
```

## 4. 디렉토리 구조 및 컴포넌트 설계

```
/src
├── app
│   ├── (auth)              # 로그인, 회원가입
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (main)              # 메인 앱 (Layout with Bottom Tab)
│   │   ├── layout.tsx      # BottomNav 포함
│   │   ├── page.tsx        # Dashboard
│   │   ├── calendar        # 가계부 탭
│   │   │   └── page.tsx
│   │   ├── assets          # 자산 탭
│   │   │   └── page.tsx
│   │   └── settings        # 설정
│   │       └── page.tsx
│   └── api                 # Route Handlers
├── components
│   ├── ui                  # shadcn/ui atoms (Button, Card, etc.)
│   ├── layout
│   │   ├── BottomNav.tsx
│   │   └── Header.tsx
│   ├── dashboard
│   │   ├── ExpenseDonut.tsx
│   │   └── ActivitySheet.tsx
│   ├── calendar
│   │   ├── MonthlyCalendar.tsx # react-calendar custom
│   │   └── TransactionModal.tsx
│   └── assets
│       ├── AssetFilterTabs.tsx # 조건부 렌더링 로직 포함
│       ├── PortfolioChart.tsx  # Recharts Donut
│       ├── TrendChart.tsx      # Recharts Line
│       └── AssetList.tsx
├── lib
│   ├── supabase            # Client & Server Clients
│   ├── stores              # Zustand (useTabStore, etc.)
│   └── utils.ts            # formatCurrency, etc.
└── hooks
    ├── useAssets.ts        # Fetch & Filter logic
    └── useTransactions.ts
```

## 5. 핵심 구현 가이드 (Step-by-Step)

### Step 1: 자산 탭의 조건부 필터링 (Conditional Tabs)

`src/components/assets/AssetFilterTabs.tsx` 구현 시:

```typescript
// Pseudo Code Logic
const AssetFilterTabs = ({ assets, householdMembers }) => {
  const currentUserId = useUser().id;
  const hasSpouse = householdMembers.length > 1;
  const hasChildAssets = assets.some(a => a.owner_type === 'CHILD');

  const tabs = [
    { id: 'ALL', label: '전체' },
    { id: 'JOINT', label: '공동' },
    { id: currentUserId, label: '나' }, // INDIVIDUAL
  ];

  if (hasSpouse) {
    const spouse = householdMembers.find(m => m.id !== currentUserId);
    tabs.push({ id: spouse.id, label: spouse.name });
  }

  if (hasChildAssets) {
    tabs.push({ id: 'CHILD', label: '자녀' });
  }

  return <TabsList items={tabs} ... />;
};
```

### Step 2: 동적 차트 데이터 매핑

`useAssets.ts` 훅에서 선택된 Tab ID에 따라 데이터를 필터링하여 리턴합니다.

- `filteredAssets`: 리스트 및 도넛 차트용.
- `trendHistory`: 라인 차트용 (`asset_history.breakdown_data[tabId]` 파싱).

### Step 3: 활동 기록 (Activity Log)

데이터 변경(Mutation) 발생 시, Supabase Trigger 또는 API Route에서 로그를 남겨야 합니다.

- **예시**: `Transaction` 추가 시 `activity_logs`에 INSERT.
- **UI**: 메인 화면 우측 상단 `BellIcon` 클릭 -> `Sheet` 컴포넌트 오픈 -> `useQuery`로 로그 목록 Fetch.

### Step 4: 캘린더 뷰 (Custom Style)

`react-calendar`의 기본 스타일을 CSS Module 또는 Tailwind로 덮어씌웁니다.

- `.react-calendar__tile`: 각 날짜 셀.
- `tileContent` prop을 사용하여 수입/지출 요약 점(Dot)이나 텍스트를 렌더링합니다.

---

## 6. AI 개발 도구용 프롬프트 (For Cursor/Claude)

이 기획서를 바탕으로 개발을 시작할 때, 아래 프롬프트를 AI 코딩 툴에 입력하세요.

> **Prompt:**
> "나는 부부 공동 가계부 웹앱을 만들고 있어. Next.js 14, Supabase, Tailwind CSS를 사용해.
>
> 1. **DB 스키마**: 첨부한 PRD v2.0의 `3.1 Tables` SQL을 참고해서 Supabase 마이그레이션 파일을 생성해줘. 특히 `asset_history`의 JSONB 구조와 `assets`의 `owner_type` Enum 처리에 유의해.
> 2. **자산 탭 로직**: `AssetFilterTabs` 컴포넌트를 만들 때, 가구원 수와 자녀 자산 유무에 따라 탭이 동적으로 보이거나 숨겨져야 해. PRD의 'Step 1' 로직을 정확히 구현해줘.
> 3. **차트 연동**: Recharts를 사용해서, 상단 탭이 변경될 때마다 도넛 차트와 라인 차트, 그리고 하단 자산 리스트가 부드럽게 전환(Transition)되도록 구현해줘.
> 4. **캘린더**: `react-calendar`를 설치하고, 날짜 칸 안에 수입(파란색)/지출(빨간색) 합계를 작게 표시해줘. 날짜를 클릭하면 모달이 떠야 해."

---

**[프로젝트 승인 완료]**
이것으로 `부부 공동 가계부`의 최종 기획서 작성이 완료되었습니다. 이 문서는 개발자가 모호함 없이 작업을 수행할 수 있는 수준의 구체성을 담고 있습니다. 바로 개발에 착수하셔도 좋습니다! 🚀
