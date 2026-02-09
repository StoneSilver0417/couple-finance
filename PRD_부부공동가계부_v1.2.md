# PRD: 부부 공동 가계부 (Couple Finance Tracker)

## 1. 프로젝트 개요

### 1.1 목적
부부가 함께 사용할 수 있는 모바일 중심의 가계부 웹 애플리케이션을 개발하여, 투명한 재정 관리와 효율적인 예산 계획을 지원합니다.

### 1.2 핵심 가치
- **투명성**: 부부가 모든 수입/지출을 공유하며 재정 투명성 확보
- **협업**: 두 사람이 동시에 데이터를 입력하고 관리
- **접근성**: 언제 어디서나 모바일로 쉽게 접근 가능한 PWA
- **보안성**: RLS를 통한 철저한 데이터 격리

### 1.3 기술 스택
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth + RLS)
- **PWA**: next-pwa
- **Charts**: Recharts or Chart.js

## 2. 사용자 스토리

### 2.1 인증 및 온보딩
- 사용자는 이메일/비밀번호로 회원가입할 수 있다
- 사용자는 소셜 로그인(Google, Kakao)으로 가입할 수 있다
- 첫 가입 시, 사용자는 "가구(Household)"를 생성하거나 배우자의 초대 링크로 기존 가구에 참여할 수 있다
- 사용자는 배우자를 초대할 수 있는 링크/코드를 생성할 수 있다

### 2.2 수입/지출 관리
- 사용자는 수입 또는 지출 항목을 추가할 수 있다
  - 날짜, 금액, 카테고리, 메모, 결제수단 입력
- 사용자는 입력한 항목을 수정/삭제할 수 있다
- 사용자는 거래 내역을 날짜별, 카테고리별로 필터링하여 볼 수 있다
- 사용자는 월별 수입/지출 요약을 확인할 수 있다
- **사용자는 고정 지출과 변동 지출을 구분하여 관리할 수 있다**
- **사용자는 비정기 지출을 별도로 추적할 수 있다**

### 2.3 예산 관리
- 사용자는 월별 총 예산을 설정할 수 있다
- 사용자는 카테고리별 예산을 설정할 수 있다
- 사용자는 현재 지출 대비 예산 사용률을 확인할 수 있다
- 예산 초과 시 시각적 경고를 받을 수 있다
- **사용자는 예산 대비 실적을 항목별로 비교할 수 있다**

### 2.4 자산 현황
- 사용자는 보유 자산(은행 계좌, 투자 자산 등)을 등록할 수 있다
- 사용자는 월별 자산 변동 그래프를 확인할 수 있다
- 사용자는 자산별 비율을 원형 차트로 확인할 수 있다
- **사용자는 저축 목표를 설정하고 진행률을 추적할 수 있다**
- **사용자는 전년 대비 소자산 증가율을 확인할 수 있다**

### 2.5 월별 재정 관리
- **사용자는 이월 금액을 다음 달로 자동 이월할 수 있다**
- **사용자는 월별 수입 총액, 지출 총액, 현재 잔액을 한눈에 볼 수 있다**
- **사용자는 연간 대비 소자산 증가율을 추적할 수 있다**

## 3. 기능 명세

### 3.1 인증 시스템
**우선순위: P0 (필수)**

- 이메일/비밀번호 회원가입 및 로그인
- 소셜 로그인 (Google OAuth)
- 비밀번호 재설정
- 세션 관리 및 자동 로그인

### 3.2 멀티 테넌시 구조
**우선순위: P0 (필수)**

- Household (가구) 개념 도입
  - 한 Household에 최대 2명의 사용자 (부부)
  - Household별 데이터 완전 격리
- 초대 시스템
  - 고유 초대 코드 생성
  - 초대 코드로 가구 참여
- RLS 정책으로 Household ID 기반 접근 제어

### 3.3 거래 관리
**우선순위: P0 (필수)**

#### 3.3.1 거래 입력
- 수입/지출 구분
- 필수 입력: 날짜, 금액, 카테고리
- 선택 입력: 메모, 결제수단
- **고정/변동 지출 구분**
- **비정기 지출 플래그**
- 반복 거래 설정 (예: 월급, 월세)

#### 3.3.2 카테고리
**기본 수입 카테고리**:
- 월급
- 상여
- 수당
- 기타 수입

**기본 지출 카테고리 (고정 지출)**:
- 대출상환
- 임차료 (월세)
- 아파트 관리비
- 공과금
- 통신비
- 교육비
- 보험료

**기본 지출 카테고리 (변동 지출)**:
- 식비
- 외식비
- 생필품
- 건강/의료
- 아기 용품
- 교통비
- 문화/여가
- 쇼핑
- 기타

**비정기 지출**:
- 경조사비
- 세금
- 자동차 관련
- 대형 구매
- 기타

#### 3.3.3 거래 목록
- 월별/주별/일별 필터
- 카테고리별 필터
- 수입/지출 구분 필터
- **고정/변동/비정기 지출 필터**
- 검색 기능 (메모 기반)
- 무한 스크롤 또는 페이지네이션

### 3.4 예산 관리
**우선순위: P1 (중요)**

- 월별 총 예산 설정
- 카테고리별 예산 설정
- 실시간 예산 사용률 표시
- 예산 대비 지출 진행률 차트
- **항목별 예산과 실적 정리 테이블**
  - 예산 금액
  - 실제 지출 금액
  - 차이 금액
  - 달성률 (%)
- 예산 초과 경고

### 3.5 대시보드 (메인 화면)
**우선순위: P0 (필수)**

#### 3.5.1 상단 요약 정보
- **이월 금액 표시**
- **수입 총액 (당월)**
- **지출 총액 (당월)**
- **현재 잔액 = 이월 금액 + 수입 총액 - 지출 총액**

#### 3.5.2 자산 현황
- **자산 관용 원형 차트**
  - 저금 자산
  - 자녀 자산
  - 비율 표시
- **손 저산 막대 그래프**
  - 월별 추이 (최근 12개월)
  - 전월 대비 증감

#### 3.5.3 예산 현황
- **수입 항목 리스트**
  - 고정 수입 (월급, 상여 등)
  - 비정기 수입
- **지출 항목 리스트**
  - 고정 지출 (임차료, 관리비, 공과금 등)
  - 변동 지출 (식비, 외식비 등)
  - 비정기 지출
- **월별 예산 진행률**

#### 3.5.4 연간 분석
- **전년 대비 소자산 증가율 그래프**
  - 라인 차트로 추이 표시
  - 월별 데이터 포인트
  - 증가율 % 표시

### 3.6 월별 상세 페이지
**우선순위: P0 (필수)**

각 월(1월~12월) 별도 페이지:

#### 3.6.1 월별 요약
- 이월 금액
- 수입 총액
- 지출 총액
- 현재 잔액

#### 3.6.2 수입 내역
- 날짜별 수입 항목
- 카테고리별 분류
- 금액 합계

#### 3.6.3 지출 내역 (구분별 정리)
- **고정 지출 섹션**
  - 날짜, 지출 항목, 지출 내역, 금액
  - 고정 지출 합계
- **변동 지출 섹션**
  - 날짜, 지출 항목, 지출 내역, 금액
  - 변동 지출 합계
- **비정기 지출 섹션**
  - 날짜, 지출 항목, 지출 내역, 금액
  - 비정기 지출 합계

#### 3.6.4 항목별 예산과 실적 정리
- 각 카테고리별로:
  - 예산 금액
  - 실제 지출 금액
  - 차이 (예산 - 실제)
  - 달성률 (%)
- 시각적 표현 (프로그레스 바 또는 게이지)

### 3.7 자산 관리
**우선순위: P1 (중요)**

#### 3.7.1 자산 종류
- **저금 자산**: 은행 계좌, 적금, 예금
- **자녀 자산**: 자녀 명의 계좌, 교육 적금
- **투자 자산**: 주식, 펀드, 기타 투자
- **기타 자산**: 현금, 기타

#### 3.7.2 자산 기능
- 자산별 잔액 입력/수정
- 월말 자산 스냅샷 자동 저장
- 월별 자산 변동 그래프
- 자산 유형별 비율 차트 (도넛 차트)
- **손 저산(순자산) 계산**: 총 자산 - 총 부채

#### 3.7.3 저축 목표
- 목표 금액 설정
- 목표 달성 기한
- 현재 진행률 표시
- 월별 저축 권장 금액 계산

### 3.8 카테고리 관리 (중요 확장)
**우선순위: P0 (필수)**

#### 3.8.1 카테고리 CRUD
사용자(부부)가 직접 카테고리를 관리할 수 있는 기능:

- **카테고리 조회**
  - 수입 카테고리 목록
  - 지출 카테고리 목록 (고정/변동/비정기 구분)
  - 기본 카테고리와 커스텀 카테고리 구분 표시

- **카테고리 추가**
  - 카테고리 이름 입력
  - 타입 선택 (수입/지출)
  - 지출인 경우: 고정/변동/비정기 선택
  - 아이콘 선택 (이모지 또는 아이콘 라이브러리)
  - 색상 선택 (Color Picker)
  - 순서 지정 (드래그 앤 드롭)

- **카테고리 수정**
  - 기본 카테고리: 이름, 아이콘, 색상 수정 가능
  - 커스텀 카테고리: 모든 필드 수정 가능
  - 지출 구분(고정/변동/비정기) 변경 가능

- **카테고리 삭제**
  - 커스텀 카테고리만 삭제 가능
  - 기본 카테고리는 숨김 처리만 가능
  - 삭제 시 해당 카테고리로 등록된 거래 처리:
    - 옵션 1: "기타" 카테고리로 자동 이동
    - 옵션 2: 삭제 불가 경고 (거래가 있는 경우)
  - 확인 다이얼로그 표시

- **카테고리 순서 변경**
  - 드래그 앤 드롭으로 순서 조정
  - 자주 사용하는 카테고리를 상단에 배치

- **카테고리 숨김/표시**
  - 사용하지 않는 기본 카테고리 숨김 처리
  - 숨긴 카테고리 목록 별도 관리
  - 필요시 다시 표시 가능

#### 3.8.2 카테고리 관리 UI/UX
- **카테고리 관리 페이지**: `/settings/categories`
  - 탭 구조: 수입 / 지출(고정) / 지출(변동) / 지출(비정기)
  - 각 카테고리 카드 형태로 표시
  - + 버튼으로 새 카테고리 추가
  - 편집 아이콘 클릭으로 수정 모드
  - 스와이프 액션으로 삭제/숨김

- **카테고리 추가/수정 모달**
  ```
  ┌─────────────────────────┐
  │  카테고리 추가/수정     │
  ├─────────────────────────┤
  │ 이름: [_________]       │
  │ 타입: ⚪수입 ⚫지출     │
  │ 구분: ⚪고정 ⚫변동     │
  │       ⚪비정기          │
  │ 아이콘: 🍔 🚗 🏠 ...   │
  │ 색상: [Color Picker]    │
  ├─────────────────────────┤
  │  [취소]  [저장]        │
  └─────────────────────────┘
  ```

#### 3.8.3 카테고리 사용 통계
- 카테고리별 사용 빈도 표시
- 최근 30일 사용 횟수
- 총 거래 금액 표시
- 미사용 카테고리 안내

#### 3.8.4 월별 예산 설정
- 월별로 카테고리별 예산 입력
- 전월 예산 복사 기능
- 연간 예산 일괄 설정
- 카테고리 추가 시 예산도 함께 설정 옵션

#### 3.8.5 검색 기능
- 월 선택 드롭다운
- 분류 항목 선택
- 수입/지출 항목 선택
- 검색 결과 표시

### 3.9 PWA 기능
**우선순위: P0 (필수)**

- 앱 설치 프롬프트
- 오프라인 지원 (최소한의 캐싱)
- 모바일 최적화 UI
- 홈 화면 추가 아이콘
- Splash screen

### 3.10 설정
**우선순위: P1 (중요)**

- 프로필 수정 (이름, 프로필 이미지)
- 가구 정보 확인
- 배우자 초대
- **카테고리 관리 (별도 페이지로 이동)**
  - 카테고리 추가/수정/삭제
  - 카테고리 순서 변경
  - 카테고리 숨김/표시
  - 사용 통계 확인
- 결제수단 관리
- 앱 설정
  - 알림 설정
  - 테마 설정 (라이트/다크)
  - 언어 설정
- 데이터 관리
  - 데이터 내보내기
  - 데이터 초기화
- 정보
  - 버전 정보
  - 이용약관
  - 개인정보처리방침
- 로그아웃
- 회원탈퇴

## 4. 데이터베이스 스키마

### 4.1 테이블 구조

```sql
-- Users (Supabase Auth 연동)
-- auth.users 테이블 사용

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Households
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly Balances (월별 이월 금액 관리)
CREATE TABLE monthly_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  carry_over_amount DECIMAL(12, 2) NOT NULL DEFAULT 0, -- 이월 금액
  income_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  expense_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(12, 2) NOT NULL DEFAULT 0, -- 현재 잔액
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, year, month)
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  expense_type TEXT CHECK (expense_type IN ('fixed', 'variable', 'irregular')), -- 고정/변동/비정기
  amount DECIMAL(12, 2) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL,
  memo TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  expense_category TEXT CHECK (expense_category IN ('fixed', 'variable', 'irregular')), -- 지출 세부 분류
  color TEXT,
  icon TEXT,
  is_custom BOOLEAN DEFAULT FALSE, -- 사용자 커스텀 카테고리 여부
  is_hidden BOOLEAN DEFAULT FALSE, -- 숨김 처리 여부
  display_order INTEGER DEFAULT 0, -- 표시 순서
  usage_count INTEGER DEFAULT 0, -- 사용 횟수 (통계용)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 카테고리 순서를 위한 인덱스
CREATE INDEX idx_categories_display_order ON categories(household_id, type, display_order);

-- Payment Methods
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT, -- 'card', 'cash', 'bank', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets (항목별 예산)
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  budget_amount DECIMAL(12, 2) NOT NULL,
  actual_amount DECIMAL(12, 2) DEFAULT 0, -- 실제 지출 (계산용)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, category_id, year, month)
);

-- Assets
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'savings', 'child', 'investment', 'cash', 'other'
  current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  is_liability BOOLEAN DEFAULT FALSE, -- 부채 여부 (대출 등)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Snapshots (월별 자산 기록)
CREATE TABLE asset_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset_id, year, month)
);

-- Savings Goals (저축 목표)
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  goal_name TEXT NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) DEFAULT 0,
  target_date DATE,
  is_achieved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Net Worth History (순자산 추이)
CREATE TABLE net_worth_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_assets DECIMAL(12, 2) NOT NULL,
  total_liabilities DECIMAL(12, 2) NOT NULL,
  net_worth DECIMAL(12, 2) NOT NULL, -- 순자산 = 자산 - 부채
  yoy_growth_rate DECIMAL(5, 2), -- 전년 대비 증가율 (%)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, year, month)
);
```

### 4.2 RLS 정책

```sql
-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Households RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own household"
  ON households FOR SELECT
  USING (id IN (
    SELECT household_id FROM profiles WHERE id = auth.uid()
  ));

-- Monthly Balances RLS
ALTER TABLE monthly_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view household monthly balances"
  ON monthly_balances FOR SELECT
  USING (household_id IN (
    SELECT household_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage household monthly balances"
  ON monthly_balances FOR ALL
  USING (household_id IN (
    SELECT household_id FROM profiles WHERE id = auth.uid()
  ));

-- Transactions RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view household transactions"
  ON transactions FOR SELECT
  USING (household_id IN (
    SELECT household_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert household transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update household transactions"
  ON transactions FOR UPDATE
  USING (household_id IN (
    SELECT household_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete household transactions"
  ON transactions FOR DELETE
  USING (household_id IN (
    SELECT household_id FROM profiles WHERE id = auth.uid()
  ));

-- Categories, Budgets, Assets, Savings Goals, Net Worth History 등 
-- 동일한 패턴으로 RLS 적용 (household_id 기반)

-- 나머지 테이블들도 동일한 패턴으로 RLS 정책 적용
-- (간결성을 위해 생략, 실제 구현 시 모든 테이블에 적용)
```

### 4.3 기본 데이터 시딩

```sql
-- 가구 생성 시 기본 카테고리 자동 생성
CREATE OR REPLACE FUNCTION create_default_categories(p_household_id UUID)
RETURNS VOID AS $$
BEGIN
  -- 수입 카테고리
  INSERT INTO categories (household_id, name, type, color, icon, display_order) VALUES
    (p_household_id, '월급', 'income', '#10B981', '💰', 1),
    (p_household_id, '상여', 'income', '#10B981', '🎁', 2),
    (p_household_id, '수당', 'income', '#10B981', '💵', 3),
    (p_household_id, '기타 수입', 'income', '#10B981', '💸', 4);
  
  -- 고정 지출 카테고리
  INSERT INTO categories (household_id, name, type, expense_category, color, icon, display_order) VALUES
    (p_household_id, '대출상환', 'expense', 'fixed', '#EF4444', '🏦', 1),
    (p_household_id, '임차료', 'expense', 'fixed', '#EF4444', '🏠', 2),
    (p_household_id, '아파트관리비', 'expense', 'fixed', '#EF4444', '🏢', 3),
    (p_household_id, '공과금', 'expense', 'fixed', '#EF4444', '💡', 4),
    (p_household_id, '통신비', 'expense', 'fixed', '#EF4444', '📱', 5),
    (p_household_id, '교육비', 'expense', 'fixed', '#EF4444', '📚', 6),
    (p_household_id, '보험료', 'expense', 'fixed', '#EF4444', '🛡️', 7);
  
  -- 변동 지출 카테고리
  INSERT INTO categories (household_id, name, type, expense_category, color, icon, display_order) VALUES
    (p_household_id, '식비', 'expense', 'variable', '#F59E0B', '🍚', 1),
    (p_household_id, '외식비', 'expense', 'variable', '#F59E0B', '🍔', 2),
    (p_household_id, '생필품', 'expense', 'variable', '#F59E0B', '🧴', 3),
    (p_household_id, '건강/의료', 'expense', 'variable', '#F59E0B', '💊', 4),
    (p_household_id, '아기', 'expense', 'variable', '#F59E0B', '👶', 5),
    (p_household_id, '교통비', 'expense', 'variable', '#F59E0B', '🚗', 6),
    (p_household_id, '문화/여가', 'expense', 'variable', '#F59E0B', '🎬', 7),
    (p_household_id, '쇼핑', 'expense', 'variable', '#F59E0B', '🛍️', 8);
  
  -- 비정기 지출 카테고리
  INSERT INTO categories (household_id, name, type, expense_category, color, icon, display_order) VALUES
    (p_household_id, '경조사비', 'expense', 'irregular', '#8B5CF6', '💐', 1),
    (p_household_id, '세금', 'expense', 'irregular', '#8B5CF6', '📋', 2),
    (p_household_id, '자동차', 'expense', 'irregular', '#8B5CF6', '🚙', 3),
    (p_household_id, '대형구매', 'expense', 'irregular', '#8B5CF6', '📦', 4),
    (p_household_id, '기타', 'expense', 'irregular', '#8B5CF6', '📝', 5);
END;
$$ LANGUAGE plpgsql;

-- 카테고리 사용 횟수 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_category_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE categories 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE categories 
    SET usage_count = GREATEST(0, usage_count - 1),
        updated_at = NOW()
    WHERE id = OLD.category_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.category_id != NEW.category_id THEN
    -- 카테고리 변경 시
    UPDATE categories 
    SET usage_count = GREATEST(0, usage_count - 1),
        updated_at = NOW()
    WHERE id = OLD.category_id;
    
    UPDATE categories 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = NEW.category_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_category_usage_trigger
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_category_usage_count();
```

## 5. UI/UX 설계

### 5.1 화면 구조

#### 5.1.1 인증 페이지
- `/login` - 로그인
- `/signup` - 회원가입
- `/onboarding` - 가구 생성/참여

#### 5.1.2 메인 페이지
- `/` (Dashboard/메인화면) - 통합 대시보드
  - 월별 요약 (이월금액, 수입총액, 지출총액, 현재잔액)
  - 자산 관용 차트
  - 손 저산 그래프
  - 연간 대비 소자산 증가율 그래프
  
- `/transactions` - 거래 내역 통합 페이지
- `/transactions/new` - 거래 추가
- `/transactions/[month]` - 월별 상세 페이지 (1월~12월)

- `/budget` - 예산 관리
  - 월별 예산 설정
  - 항목별 예산과 실적 정리
  
- `/assets` - 자산 현황
  - 자산 목록
  - 자산 추이 그래프
  - 저축 목표 관리
  
- `/list` - 리스트 및 검색
  - 거래 검색
  
- `/settings` - 설정
  - `/settings/profile` - 프로필 설정
  - `/settings/household` - 가구 관리
  - `/settings/categories` - **카테고리 관리 (상세)**
  - `/settings/payment-methods` - 결제수단 관리
  - `/settings/data` - 데이터 관리

### 5.2 네비게이션
- 하단 탭 바 (모바일 중심)
  - 홈 (대시보드)
  - 거래 내역
  - 추가 (+)
  - 예산/자산
  - 더보기

### 5.3 디자인 원칙
- **모바일 우선**: 320px ~ 428px 화면에 최적화
- **미니멀**: 깔끔하고 직관적인 인터페이스
- **색상 시스템**:
  - 수입: Green (#10B981)
  - 고정 지출: Red (#EF4444)
  - 변동 지출: Orange (#F59E0B)
  - 비정기 지출: Purple (#8B5CF6)
  - 자산: Blue (#3B82F6)
- **타이포그래피**: 가독성 높은 폰트, 적절한 행간
- **인터랙션**: 즉각적인 피드백, 스무스한 애니메이션

### 5.4 주요 컴포넌트

#### 5.4.1 대시보드 컴포넌트
- **MonthSummaryCard**: 월별 요약 (이월/수입/지출/잔액)
- **AssetPieChart**: 자산 관용 도넛 차트
- **NetWorthBarChart**: 손 저산 막대 그래프
- **GrowthRateLineChart**: 전년 대비 증가율 라인 차트

#### 5.4.2 거래 관련 컴포넌트
- **TransactionCard**: 거래 카드
  - 날짜, 카테고리, 금액, 메모
  - 고정/변동/비정기 배지
- **CategoryBadge**: 카테고리 뱃지 (색상 구분)
- **TransactionForm**: 거래 입력 폼
- **ExpenseTypeToggle**: 고정/변동/비정기 토글

#### 5.4.3 예산 관련 컴포넌트
- **BudgetProgressBar**: 예산 진행률 바
- **BudgetVsActualTable**: 예산 대비 실적 테이블
- **BudgetCategoryCard**: 카테고리별 예산 카드

#### 5.4.4 자산 관련 컴포넌트
- **AssetCard**: 자산 카드
- **SavingsGoalCard**: 저축 목표 카드
- **AssetTrendChart**: 자산 추이 차트

#### 5.4.5 카테고리 관리 컴포넌트
- **CategoryCard**: 카테고리 카드 (편집/삭제 버튼 포함)
- **CategoryForm**: 카테고리 추가/수정 폼
  - 이름 입력
  - 타입 선택 (수입/지출)
  - 지출 구분 선택 (고정/변동/비정기)
  - 아이콘 선택기
  - 색상 선택기
- **CategoryList**: 드래그 앤 드롭 가능한 카테고리 리스트
- **CategoryIconPicker**: 아이콘 선택 모달
- **ColorPicker**: 색상 선택 컴포넌트
- **CategoryStats**: 카테고리 사용 통계

#### 5.4.6 공통 컴포넌트
- **BottomSheet**: 하단 시트
- **FloatingActionButton**: 추가 버튼
- **MonthSelector**: 월 선택 드롭다운
- **DatePicker**: 날짜 선택기
- **AmountInput**: 금액 입력 (숫자 키패드)

### 5.5 화면별 상세 레이아웃

#### 5.5.1 메인 화면 (대시보드)
```
┌─────────────────────────┐
│  📊 2026년 1월          │
├─────────────────────────┤
│ 이월 금액: ₩1,000,000  │
│ 수입 총액: ₩5,000,000  │
│ 지출 총액: ₩3,500,000  │
│ 현재 잔액: ₩2,500,000  │
├─────────────────────────┤
│   자산 관용 (도넛차트)  │
│   - 저금 자산: 50%      │
│   - 자녀 자산: 30%      │
│   - 투자 자산: 20%      │
├─────────────────────────┤
│  손 저산 (막대그래프)   │
│  월별 추이              │
├─────────────────────────┤
│  전년대비 증가율        │
│  (라인 차트)            │
└─────────────────────────┘
```

#### 5.5.2 월별 상세 페이지
```
┌─────────────────────────┐
│  📅 1월                 │
├─────────────────────────┤
│ 이월: ₩1,000,000       │
│ 수입: ₩5,000,000       │
│ 지출: ₩3,500,000       │
│ 잔액: ₩2,500,000       │
├─────────────────────────┤
│  📥 수입                │
│  [날짜] [항목] [금액]   │
├─────────────────────────┤
│  📤 고정 지출           │
│  [날짜] [항목] [금액]   │
├─────────────────────────┤
│  📤 변동 지출           │
│  [날짜] [항목] [금액]   │
├─────────────────────────┤
│  📤 비정기 지출         │
│  [날짜] [항목] [금액]   │
├─────────────────────────┤
│  📊 예산 대비 실적      │
│  [카테고리별 테이블]    │
└─────────────────────────┘
```

#### 5.5.3 카테고리 관리 페이지
```
┌─────────────────────────────────┐
│  ⚙️ 카테고리 관리               │
├─────────────────────────────────┤
│  탭: [수입] [지출-고정] ...    │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │ 🍔 외식비          [편집] │  │
│  │ 색상: 🟠 | 사용: 23회     │  │
│  │ [숨김] [▲] [▼]           │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 🚗 교통비          [편집] │  │
│  │ 색상: 🟡 | 사용: 18회     │  │
│  │ [숨김] [▲] [▼]           │  │
│  └───────────────────────────┘  │
│                                 │
│  [+ 새 카테고리 추가]          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  카테고리 추가/수정             │
├─────────────────────────────────┤
│ 이름: [외식비________]          │
│                                 │
│ 타입: ⚪수입 ⚫지출             │
│                                 │
│ 구분: ⚪고정 ⚫변동             │
│       ⚪비정기                  │
│                                 │
│ 아이콘 선택:                    │
│ 🍔 🍕 🍜 🍱 🍰 ☕              │
│ 🚗 🚕 🚌 🚇 ✈️ 🚲              │
│ 🏠 💡 📱 💊 📚 🎬              │
│ [더보기...]                     │
│                                 │
│ 색상: [🟠 Color Picker]        │
│                                 │
│ 통계: 최근 30일 사용 15회       │
│       총 지출 ₩850,000          │
├─────────────────────────────────┤
│  [삭제]  [취소]  [저장]        │
└─────────────────────────────────┘
```

## 6. 기술 구현 사항

### 6.1 Next.js 구조
```
/app
  /(auth)
    /login
    /signup
    /onboarding
  /(app)
    /dashboard (메인화면)
    /transactions
      /[month] (월별 상세)
      /new (추가)
    /budget
    /assets
    /list (리스트 및 검색)
    /settings
      /profile
      /household
      /categories (카테고리 관리)
      /payment-methods
      /data
  /api
    /auth
    /transactions
    /budgets
    /assets
    /categories (CRUD API)
    /monthly-balances
/components
  /ui (shadcn/ui 기반)
  /dashboard
    /MonthSummaryCard
    /AssetPieChart
    /NetWorthBarChart
    /GrowthRateLineChart
  /transactions
    /TransactionCard
    /TransactionForm
    /ExpenseTypeToggle
  /budget
    /BudgetProgressBar
    /BudgetVsActualTable
  /assets
    /AssetCard
    /SavingsGoalCard
  /categories
    /CategoryCard
    /CategoryForm
    /CategoryList
    /CategoryIconPicker
    /ColorPicker
    /CategoryStats
  /charts
/lib
  /supabase
  /utils
  /calculations (재정 계산 로직)
  /constants
    /icons.ts (아이콘 목록)
    /colors.ts (색상 팔레트)
/hooks
  /useMonthlyBalance
  /useTransactions
  /useBudgets
  /useAssets
  /useCategories (카테고리 CRUD 훅)
/types
  /database.types (Supabase 자동 생성)
  /transaction.types
  /budget.types
  /category.types
```

### 6.2 상태 관리
- Server Components 우선 사용
- Client Components에서 React Query (TanStack Query) 사용
- 전역 상태: Zustand (최소한으로 사용)
  - 선택된 월 (currentMonth)
  - 사용자 설정 (userPreferences)

### 6.3 데이터 계산 로직

#### 6.3.1 월별 잔액 계산
```typescript
// lib/calculations/monthly-balance.ts
export function calculateMonthlyBalance(
  carryOverAmount: number,
  incomeTotal: number,
  expenseTotal: number
): number {
  return carryOverAmount + incomeTotal - expenseTotal;
}

// 다음 달 이월 금액 자동 계산
export function calculateNextMonthCarryOver(
  currentMonth: MonthlyBalance
): number {
  return currentMonth.current_balance;
}
```

#### 6.3.2 예산 대비 실적 계산
```typescript
// lib/calculations/budget-performance.ts
export function calculateBudgetPerformance(
  budgetAmount: number,
  actualAmount: number
) {
  const difference = budgetAmount - actualAmount;
  const achievementRate = (actualAmount / budgetAmount) * 100;
  
  return {
    budgetAmount,
    actualAmount,
    difference,
    achievementRate,
    isOverBudget: actualAmount > budgetAmount
  };
}
```

#### 6.3.3 순자산 및 증가율 계산
```typescript
// lib/calculations/net-worth.ts
export function calculateNetWorth(
  totalAssets: number,
  totalLiabilities: number
): number {
  return totalAssets - totalLiabilities;
}

export function calculateYoYGrowthRate(
  currentNetWorth: number,
  previousYearNetWorth: number
): number {
  if (previousYearNetWorth === 0) return 0;
  return ((currentNetWorth - previousYearNetWorth) / previousYearNetWorth) * 100;
}
```

### 6.4 API 엔드포인트

#### 6.4.1 카테고리 관리 API
```typescript
// GET /api/categories
// 가구의 모든 카테고리 조회
Response: {
  income: Category[],
  expense: {
    fixed: Category[],
    variable: Category[],
    irregular: Category[]
  }
}

// POST /api/categories
// 새 카테고리 생성
Body: {
  name: string,
  type: 'income' | 'expense',
  expense_category?: 'fixed' | 'variable' | 'irregular',
  icon?: string,
  color?: string,
  display_order?: number
}

// PUT /api/categories/:id
// 카테고리 수정
Body: {
  name?: string,
  icon?: string,
  color?: string,
  is_hidden?: boolean,
  display_order?: number
}

// DELETE /api/categories/:id
// 카테고리 삭제 (커스텀 카테고리만)
// 거래 내역이 있는 경우 삭제 불가

// PUT /api/categories/reorder
// 카테고리 순서 변경
Body: {
  categories: Array<{ id: string, display_order: number }>
}

// GET /api/categories/:id/stats
// 카테고리 사용 통계
Response: {
  usage_count: number,
  total_amount: number,
  last_used_at: string,
  recent_transactions: Transaction[]
}
```

### 6.5 PWA 설정
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA({
  // Next.js config
})
```

```json
// public/manifest.json
{
  "name": "부부 공동 가계부",
  "short_name": "가계부",
  "description": "부부가 함께 사용하는 스마트 가계부",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 6.6 Supabase 클라이언트
- Server-side: `@supabase/ssr`
- Client-side: `@supabase/supabase-js`
- 미들웨어에서 인증 상태 확인

### 6.7 보안
- 모든 API 라우트에서 인증 확인
- RLS로 데이터베이스 레벨 보안
- CSRF 방지
- SQL Injection 방지 (Parameterized Query)
- XSS 방지 (입력값 sanitization)

## 7. 성능 최적화

- 이미지 최적화 (Next.js Image)
- 코드 스플리팅
- React Query로 데이터 캐싱
- 무한 스크롤로 대량 데이터 처리
- Debounce/Throttle 적용 (검색, 입력)
- 차트 데이터 메모이제이션
- 월별 데이터 lazy loading

## 8. 테스트 계획

### 8.1 단위 테스트
- 유틸리티 함수
- 비즈니스 로직 (계산 함수)
- 컴포넌트 로직

### 8.2 통합 테스트
- API 라우트
- 데이터베이스 쿼리
- 인증 플로우

### 8.3 E2E 테스트 (선택)
- 주요 사용자 플로우
  - 거래 입력 → 월별 요약 확인
  - 예산 설정 → 예산 초과 경고
  - 자산 입력 → 그래프 업데이트
- Playwright 사용

## 9. 배포 및 운영

### 9.1 배포
- Vercel (Next.js 호스팅)
- Supabase (프로덕션 환경)
- 커스텀 도메인 연결
- HTTPS 강제

### 9.2 모니터링
- Vercel Analytics
- Supabase Dashboard
- Error Tracking (Sentry - 선택)
- Performance Monitoring

### 9.3 백업
- Supabase 자동 백업
- 주간 데이터 export

## 10. 향후 확장 가능성

### Phase 2 기능
- 알림 기능 (예산 초과, 청구서 마감일)
- 영수증 사진 첨부
- 데이터 내보내기 (CSV, Excel, PDF)
- 다크 모드
- 다국어 지원 (한/영)

### Phase 3 기능
- AI 기반 지출 분석 및 인사이트
  - 지출 패턴 분석
  - 절약 가능 항목 추천
- 금융 목표 설정 및 추적
  - 주택 구매, 여행 등
- 은행 계좌 연동 (오픈뱅킹)
- 자동 카테고리 분류 (ML)
- 가족 구성원 확장 (자녀 추가)

### Phase 4 기능
- 커뮤니티 기능
  - 다른 부부들과 절약 팁 공유
  - 평균 지출 비교
- 재무 상담 연결
- 투자 포트폴리오 관리

## 11. 일정 및 마일스톤

### Sprint 1 (2주)
- 프로젝트 셋업 (Next.js, Supabase, Tailwind)
- 인증 시스템 구현
- 데이터베이스 스키마 및 RLS 구현
- 기본 UI 컴포넌트 (shadcn/ui)
- **기본 카테고리 시딩**

### Sprint 2 (2주)
- 거래 입력/수정/삭제 (고정/변동/비정기 구분)
- 거래 목록 및 필터링
- **카테고리 관리 페이지**
  - 카테고리 CRUD
  - 아이콘/색상 선택기
  - 드래그 앤 드롭 순서 변경
- 월별 이월 금액 로직

### Sprint 3 (2주)
- 대시보드 구현
  - 월별 요약 카드
  - 자산 관용 차트
  - 손 저산 그래프
- 월별 상세 페이지 (1월~12월)
- 수입/지출 구분별 섹션

### Sprint 4 (2주)
- 예산 관리 기능
  - 월별/카테고리별 예산 설정
  - 예산 대비 실적 테이블
- 차트 및 시각화
  - 전년 대비 증가율 그래프
  - 카테고리별 지출 비율

### Sprint 5 (1-2주)
- 자산 관리
  - 자산 CRUD
  - 자산 스냅샷
  - 저축 목표
- 순자산 계산 및 추이

### Sprint 6 (1주)
- PWA 설정 및 최적화
- 리스트/검색 페이지
- 모바일 UI 최적화

### Sprint 7 (1주)
- 최종 테스트 및 버그 수정
- 성능 최적화
- 배포 및 모니터링 설정

## 12. 핵심 차별화 요소

### 12.1 엑셀 가계부 대비 장점
1. **실시간 동기화**: 부부가 동시에 입력해도 즉시 반영
2. **모바일 최적화**: 언제 어디서나 입력 가능
3. **자동 계산**: 이월금액, 잔액, 증가율 자동 계산
4. **시각화**: 차트와 그래프로 직관적인 이해
5. **클라우드 백업**: 데이터 손실 걱정 없음
6. **접근성**: PWA로 앱처럼 사용 가능

### 12.2 기존 가계부 앱 대비 차별점
1. **부부 중심**: 두 사람이 동등하게 관리
2. **멀티 테넌시**: 친구 부부들도 각자 사용 가능
3. **고정/변동/비정기 구분**: 체계적인 지출 분류
4. **이월 금액 관리**: 월별 연속성 확보
5. **예산 대비 실적**: 상세한 예산 관리
6. **순자산 추적**: 자산 증가 추이 확인

## 13. 성공 지표 (KPI)

### 13.1 사용자 지표
- DAU (Daily Active Users)
- MAU (Monthly Active Users)
- 부부 가입 전환율
- 평균 세션 시간

### 13.2 기능 사용 지표
- 일평균 거래 입력 수
- 예산 설정 완료율
- 자산 관리 사용률
- PWA 설치율

### 13.3 품질 지표
- 페이지 로딩 속도 (< 2초)
- 에러율 (< 1%)
- 데이터 동기화 성공률 (> 99%)

---

## 변경 이력

**v1.2 (2026-01-28)**
- 카테고리 관리 기능 대폭 강화
  - 사용자가 직접 카테고리 추가/수정/삭제 가능
  - 아이콘 및 색상 커스터마이징
  - 드래그 앤 드롭으로 순서 변경
  - 카테고리 숨김/표시 기능
  - 카테고리 사용 통계 제공
- 데이터베이스 스키마 업데이트
  - categories 테이블에 display_order, is_hidden, usage_count 필드 추가
  - 카테고리 사용 횟수 자동 업데이트 트리거 추가
- API 엔드포인트 추가
  - 카테고리 CRUD API
  - 카테고리 순서 변경 API
  - 카테고리 통계 API
- UI/UX 개선
  - 카테고리 관리 전용 페이지 추가 (/settings/categories)
  - 카테고리 추가/수정 모달 디자인
  - 아이콘 선택기 및 색상 선택기 컴포넌트

**v1.1 (2026-01-28)**
- 엑셀 가계부 분석 반영
- 고정/변동/비정기 지출 구분 추가
- 이월 금액 관리 기능 추가
- 예산 대비 실적 정리 기능 추가
- 자산 관용 차트 추가
- 손 저산(순자산) 관리 추가
- 전년 대비 소자산 증가율 추적 추가
- 월별 상세 페이지 구조 개선
- 데이터베이스 스키마 확장

**v1.0 (2026-01-28)**
- 초기 PRD 작성

---

**작성일**: 2026-01-28  
**작성자**: Product Owner  
**버전**: 1.2
