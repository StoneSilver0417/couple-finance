**[Gemini 3 Pro: PRD v1.4 - UX Refinement & Calendar Edition]**

사용자님의 구체적인 피드백(이미지 기반 UI 변경, 이월 제거, 탭 분리, 달력 중심 UX)을 완벽하게 반영하여 **v1.4**로 업그레이드했습니다.

이번 버전은 **"데이터의 명확한 분리(가계부 vs 자산)"**와 **"직관적인 조작(달력 날짜 터치)"**에 초점을 맞췄습니다.

---

# PRD: 부부 공동 가계부 (Couple Finance Tracker)

## 1. 프로젝트 개요

### 1.1 목적

부부가 함께 사용할 수 있는 모바일 중심의 가계부 웹 애플리케이션입니다. 매월의 수입/지출 흐름(Flow)과 누적된 자산(Stock)을 명확히 분리하여 관리하며, 달력 기반의 직관적인 입력을 지원합니다.

### 1.2 핵심 가치

- **직관성**: 복잡한 리스트 대신 **달력(Calendar)**을 통해 재정 흐름 파악
- **명확성**: **월별 가계부(수입/지출)**와 **자산 관리(저축/투자)**의 탭 분리
- **투명성**: 활동 로그(Activity Log)를 통한 변경 내역 실시간 공유
- **단순성**: 이월금 계산 없이 해당 월의 수지타산에 집중

### 1.3 기술 스택

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion (애니메이션)
- **Backend/DB**: Supabase (PostgreSQL + Auth + RLS)
- **PWA**: next-pwa
- **Calendar Lib**: `react-calendar` 또는 `fullcalendar` (Custom Styling)

## 2. 사용자 스토리

### 2.1 메인 대시보드

- 사용자는 앱을 켜자마자 **이번 달 지출 분석(Expense Analytics)**을 최상단에서 볼 수 있다.
- 사용자는 바로 아래에서 **자산 포트폴리오 변화**를 그래프로 확인할 수 있다.
- 사용자는 상단 알림(종) 버튼을 눌러 **최근 누가 무엇을 수정했는지(활동 로그)** 확인할 수 있다.

### 2.2 가계부 (Transactions) - 달력 뷰

- **사용자는 리스트가 아닌 달력 형태로 월별 내역을 확인한다.**
- **사용자는 날짜 칸을 터치하여 바로 해당 날짜의 거래를 입력할 수 있다 (+버튼 없음).**
- 사용자는 달력의 날짜 칸에 표시된 일별 지출 합계를 통해 지출 흐름을 파악한다.

### 2.3 자산 관리 (Assets)

- 사용자는 별도의 '자산' 탭에서 보유 계좌 및 투자 내역을 관리한다.
- 사용자는 자산의 총액과 구성 비율을 확인할 수 있다.

### 2.4 설정 및 협업

- 사용자는 배우자를 초대하여 가구를 구성할 수 있다.
- 사용자는 카테고리를 커스텀(아이콘, 색상) 할 수 있다.

## 3. 기능 명세

### 3.1 메인 화면 (Dashboard)

**우선순위: P0**

- **레이아웃 변경**:
  1.  **Top**: **Expense Analytics** (지출 분석)
      - 도넛 차트 또는 게이지 바
      - 이번 달 총 지출액 및 예산 대비 퍼센트 표시
  2.  **Middle**: **Asset Portfolio Trend** (자산 추이)
      - 최근 6개월 순자산 변화 라인 차트
      - 간략한 등락폭 표시
  3.  **Bottom**: **Where we spent** (카테고리별 지출 순위)
      - 상위 3~5개 지출 카테고리 아이콘 및 금액
- **Header**:
  - 좌측: 가구명 (예: 뚜비 & Family)
  - 우측: **알림(Bell) 아이콘** -> 클릭 시 **Activity Log(활동 내역)** 바텀 시트 오픈

### 3.2 가계부 탭 (Calendar)

**우선순위: P0**

- **UI 구조**: 전체 화면 달력 (Monthly View)
- **표시 정보**:
  - 각 날짜 셀(Cell)에 '수입 합계(파란 점)', '지출 합계(빨간 텍스트)' 표시
  - 선택된 날짜 하단에 상세 거래 리스트 표시
- **인터랙션**:
  - **날짜 클릭**: 해당 날짜의 거래 입력 모달 즉시 실행 (날짜 자동 선택됨)
  - **검색 제거**: 직관성을 위해 검색 바 제거 (필요 시 필터 버튼으로 대체)

### 3.3 자산 탭 (Assets)

**우선순위: P1**

- **독립된 뷰**: 가계부(수입/지출)와 섞이지 않고 현재 보유 자산만 표시
- **기능**:
  - 자산 그룹핑 (현금성, 투자, 부동산, 부채)
  - 자산별 잔액 수정 (History 기록)
  - 총 자산 대비 부채 비율 표시

### 3.4 활동 기록 (Notification)

**우선순위: P1**

- **진입점**: 메인 화면 우측 상단 '종' 아이콘
- **기능**: 단순 푸시 알림 목록이 아닌, **가계부 변경 이력(Audit Trail)** 표시
  - "남편님이 1/28 식비 내역 수정함"
  - "아내님이 2월 예산 설정함"

## 4. 데이터베이스 스키마 변경 (v1.4)

_이월금(Carry Over) 로직 제거 및 뷰 최적화를 위한 변경_

### 4.1 테이블 구조

```sql
-- Monthly Balances (이월금 컬럼 삭제)
-- 매월 독립적인 수입/지출 합계만 저장
CREATE TABLE monthly_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  income_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  expense_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  -- current_balance, carry_over 삭제 (이월 없음)
  balance DECIMAL(12, 2) GENERATED ALWAYS AS (income_total - expense_total) STORED, -- 당월 순수익
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, year, month)
);

-- Transactions (변경 없음, Activity Log 추적용 컬럼 유지)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- ... 기존 필드 ...
  transaction_date DATE NOT NULL, -- 달력 매핑용 핵심 필드
  created_by UUID REFERENCES auth.users(id),
  last_modified_by UUID REFERENCES auth.users(id),
  -- ...
);

-- Assets (자산 탭용 독립 테이블)
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'CASH', 'BANK', 'STOCK', 'REAL_ESTATE', 'DEBT'
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset History (자산 변동 그래프용)
CREATE TABLE asset_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL,
  record_date DATE NOT NULL,
  total_assets DECIMAL(12, 2) NOT NULL,
  total_debts DECIMAL(12, 2) NOT NULL,
  net_worth DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 5. UI/UX 설계 (Wireframes)

### 5.1 네비게이션 구조

하단 탭 바 (Bottom Tab Bar):

1.  **홈 (Home)**: 대시보드 (분석 & 자산 그래프)
2.  **달력 (Calendar)**: 가계부 입력 및 조회
3.  **자산 (Assets)**: 자산 목록 및 상세
4.  **설정 (My)**: 프로필 및 관리

### 5.2 화면별 상세 레이아웃

#### 5.2.1 메인 화면 (Home)

_사용자 요청 이미지 스타일 반영 (Soft UI, Card Layout)_

```
┌───────────────────────────────────┐
│ [Profile] 뚜비 & Family       [🔔]│ <-- 종 누르면 활동로그
├───────────────────────────────────┤
│                                   │
│  Expense Analytics 📊             │
│  ┌─────────────────────────────┐  │
│  │      (Donut Chart)          │  │
│  │        SPENT                │  │
│  │       1.0만                 │  │
│  │ ● 지출 합계  100%           │  │
│  └─────────────────────────────┘  │
│                                   │
│  Asset Portfolio 📈               │
│  ┌─────────────────────────────┐  │
│  │    (Line Chart area)        │  │
│  │  ↗ +15% vs Last Month       │  │
│  └─────────────────────────────┘  │
│                                   │
│  Where we spent 💸                │
│  ┌─────────────────────────────┐  │
│  │ 🍚 식비           1.0만     │  │
│  └─────────────────────────────┘  │
│                                   │
└─[🏠]──[📅]──[💰]──[👤]────────────┘
   홈    달력   자산   설정
```

#### 5.2.2 가계부 화면 (Calendar Tab)

_검색 바 제거, +버튼 제거, 날짜 터치 방식_

```
┌───────────────────────────────────┐
│  <      2026. 02        >         │
├───────────────────────────────────┤
│ Sun Mon Tue Wed Thu Fri Sat       │
│  1   2   3   4   5   6   7        │
│     -3.5             -1.2         │ <-- 일별 지출액 (작게 표시)
│  8   9  10  11  12  13  14        │
│ [15] 16 17  18  19  20  21        │ <-- [15]일 선택됨
│  22  23 24  25  26  27  28        │
│                                   │
├───────────────────────────────────┤
│ 2월 15일 (Today)                  │
│                                   │
│ 🍚 점심식사              -12,000  │
│ 🚌 버스비                 -1,500  │
│                                   │
│ [ 날짜 칸을 탭하여 거래 추가 ]    │ <-- 안내 문구 (빈 공간)
└─[🏠]──[📅]──[💰]──[👤]────────────┘
```

#### 5.2.3 활동 기록 (Notification Sheet)

_메인 우측 상단 🔔 클릭 시_

```
┌───────────────────────────────────┐
│  🔔 Recent Activity         [X]   │
├───────────────────────────────────┤
│ 오늘                              │
│ ● 남편님이 [점심식사] 추가함      │
│   14:30 | 12,000원                │
│                                   │
│ 어제                              │
│ ● 아내님이 [자산:예금] 금액 수정  │
│   20:00 | +500,000원              │
│                                   │
│ ● 남편님이 [쇼핑] 카테고리 삭제   │
│   10:00                           │
└───────────────────────────────────┘
```

## 6. 기술 구현 사항

### 6.1 프론트엔드 (Calendar Logic)

- **Library**: `react-calendar` 커스터마이징 권장 (가볍고 스타일링 용이).
- **Optimization**: 달력의 각 셀(Cell)은 `transactions` 데이터를 일별로 `reduce`하여 렌더링. 성능을 위해 월 단위 데이터를 한 번에 fetch 후 클라이언트 사이드에서 매핑.
- **Interaction**:
  - `onClickDay`: 선택된 날짜 state 업데이트 + 하단 리스트 뷰 갱신.
  - `onDoubleClickDay` (Option): 모달 바로 열기.

### 6.2 백엔드 (API)

- **GET /api/monthly-stats**: 대시보드용 통계 (이월 제외, 당월 수입/지출만).
- **GET /api/assets/history**: 자산 추이 그래프용 데이터.
- **GET /api/transactions?start_date=...&end_date=...**: 달력 뷰용 범위 쿼리.

## 7. 디자인 시스템 (Style Guide)

_제공된 이미지를 바탕으로 한 스타일 정의_

- **Colors**:
  - Background: `#FFF5F7` (아주 연한 핑크 틴트 배경)
  - Card BG: `#FFFFFF` (White with heavy shadow)
  - Primary (Expense): `#FF4D6D` (Hot Pink/Red 계열)
  - Secondary (Asset): `#4D6DFF` (Soft Blue)
  - Text: `#2D2D2D` (Dark Gray, Not pure black)
- **Shapes**:
  - Card Radius: `24px` (둥글둥글한 느낌)
  - Button Radius: `50%` (원형)
- **Typography**:
  - Headings: Rounded Sans-serif (e.g., Toss Face Font, Pretendard Rounded)

---

## 변경 이력

**v1.4 (2026-02-01)**

- **구조 대개편**: '이월' 개념 삭제, '가계부'와 '자산' 탭 물리적/논리적 분리.
- **UI UX 변경**: 메인 화면 대시보드 재구성 (Expense 상단, Asset 중단), 리스트 뷰 -> 캘린더 뷰 전환.
- **인터랙션 변경**: + 버튼 삭제, 날짜 터치 입력 방식 도입.
- **알림 기능 정의**: 단순 푸시 -> 활동 로그(Activity Log) 조회로 변경.

**v1.3 (2026-02-01)**

- 활동 기록(Activity Log) 기능 추가

**v1.2 (2026-01-28)**

- 카테고리 관리 기능 강화

---

**작성일**: 2026-02-01
**작성자**: Product Owner
**버전**: 1.4
