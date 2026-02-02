-- PRD v2.0 정합성 마이그레이션
-- 1. asset_history 테이블 (자산 추이 스냅샷)
-- 2. payment_methods 테이블
-- 3. transactions 확장 (payment_method_id, last_modified_by)
-- 4. profiles.role 컬럼
-- 5. 자산 타입 표준화

-- ============================================
-- 1. Asset History (자산 추이 스냅샷)
-- ============================================
CREATE TABLE IF NOT EXISTS asset_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  total_net_worth DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- 필터링된 그래프용 JSON 데이터
  -- { "JOINT": 100, "user_uuid": 50, "CHILD": 10 }
  breakdown_data JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, record_date)
);

ALTER TABLE asset_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage household asset history" ON asset_history
  FOR ALL USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_asset_history_household_date ON asset_history(household_id, record_date);

-- ============================================
-- 2. Payment Methods (결제 수단)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'BANK_TRANSFER', 'OTHER')),
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage household payment methods" ON payment_methods
  FOR ALL USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

-- ============================================
-- 3. Transactions 확장
-- ============================================
-- 결제 수단 연결
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL;

-- 마지막 수정자 추적
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method_id);

-- ============================================
-- 4. Profiles 역할 추가
-- ============================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'MEMBER'));

-- ============================================
-- 5. 자산 타입 표준화 (소문자 → 대문자)
-- ============================================
-- 기존 데이터 마이그레이션
UPDATE assets SET type = 'CASH' WHERE type = 'cash';
UPDATE assets SET type = 'SAVINGS' WHERE type = 'savings';
UPDATE assets SET type = 'INVESTMENT' WHERE type = 'investment';
UPDATE assets SET type = 'REAL_ESTATE' WHERE type = 'real_estate';
UPDATE assets SET type = 'DEBT' WHERE type = 'debt';
UPDATE assets SET type = 'OTHER' WHERE type = 'other';
UPDATE assets SET type = 'CHILD_SAVINGS' WHERE type = 'child';

-- ============================================
-- 6. 기본 결제 수단 시딩 함수
-- ============================================
CREATE OR REPLACE FUNCTION create_default_payment_methods(p_household_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO payment_methods (household_id, name, type, icon, is_default, display_order) VALUES
    (p_household_id, '현금', 'CASH', '💵', TRUE, 1),
    (p_household_id, '체크카드', 'DEBIT_CARD', '💳', FALSE, 2),
    (p_household_id, '신용카드', 'CREDIT_CARD', '💳', FALSE, 3),
    (p_household_id, '계좌이체', 'BANK_TRANSFER', '🏦', FALSE, 4);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. 자산 스냅샷 저장 함수
-- ============================================
CREATE OR REPLACE FUNCTION save_asset_snapshot(p_household_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total DECIMAL(12, 2);
  v_breakdown JSONB;
BEGIN
  -- 순자산 계산 (자산 - 부채)
  SELECT COALESCE(SUM(
    CASE WHEN is_liability THEN -current_amount ELSE current_amount END
  ), 0) INTO v_total
  FROM assets
  WHERE household_id = p_household_id;

  -- 소유권별 집계
  SELECT jsonb_object_agg(
    COALESCE(
      CASE
        WHEN owner_type = 'INDIVIDUAL' THEN owner_profile_id::TEXT
        ELSE owner_type
      END,
      'JOINT'
    ),
    amount
  ) INTO v_breakdown
  FROM (
    SELECT
      owner_type,
      owner_profile_id,
      SUM(CASE WHEN is_liability THEN -current_amount ELSE current_amount END) as amount
    FROM assets
    WHERE household_id = p_household_id
    GROUP BY owner_type, owner_profile_id
  ) sub;

  -- UPSERT
  INSERT INTO asset_history (household_id, record_date, total_net_worth, breakdown_data)
  VALUES (p_household_id, CURRENT_DATE, v_total, COALESCE(v_breakdown, '{}'::jsonb))
  ON CONFLICT (household_id, record_date)
  DO UPDATE SET
    total_net_worth = EXCLUDED.total_net_worth,
    breakdown_data = EXCLUDED.breakdown_data;
END;
$$ LANGUAGE plpgsql;
