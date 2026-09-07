-- 가구(household_id) 기준 거래 및 반복 거래 RLS 정책 강화
-- 가구 구성원(부부) 간 상호 거래 수정, 반복 거래 설정 및 삭제 권한 보장

-- 1. get_my_household_id 함수 보장 (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_my_household_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT household_id FROM profiles WHERE id = auth.uid()
$$;

-- 2. transactions 테이블 RLS 정책 업데이트
DROP POLICY IF EXISTS "Users can view household transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert household transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update household transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete household transactions" ON transactions;

CREATE POLICY "Users can view household transactions" ON transactions
  FOR SELECT
  USING (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert household transactions" ON transactions
  FOR INSERT
  WITH CHECK (
    (household_id = get_my_household_id() OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()))
    AND (user_id = auth.uid() OR user_id IS NOT NULL)
  );

CREATE POLICY "Users can update household transactions" ON transactions
  FOR UPDATE
  USING (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete household transactions" ON transactions
  FOR DELETE
  USING (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

-- 3. recurring_rules 테이블 RLS 정책 업데이트
DROP POLICY IF EXISTS "Users can view household recurring rules" ON recurring_rules;
DROP POLICY IF EXISTS "Users can insert household recurring rules" ON recurring_rules;
DROP POLICY IF EXISTS "Users can update household recurring rules" ON recurring_rules;
DROP POLICY IF EXISTS "Users can delete household recurring rules" ON recurring_rules;

CREATE POLICY "Users can view household recurring rules" ON recurring_rules
  FOR SELECT
  USING (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert household recurring rules" ON recurring_rules
  FOR INSERT
  WITH CHECK (
    (household_id = get_my_household_id() OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()))
    AND (user_id = auth.uid() OR user_id IS NOT NULL)
  );

CREATE POLICY "Users can update household recurring rules" ON recurring_rules
  FOR UPDATE
  USING (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete household recurring rules" ON recurring_rules
  FOR DELETE
  USING (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

-- 4. recurring_occurrences 테이블 RLS 정책 업데이트
DROP POLICY IF EXISTS "Users can view household recurring occurrences" ON recurring_occurrences;
DROP POLICY IF EXISTS "Users can insert household recurring occurrences" ON recurring_occurrences;
DROP POLICY IF EXISTS "Users can update household recurring occurrences" ON recurring_occurrences;
DROP POLICY IF EXISTS "Users can delete household recurring occurrences" ON recurring_occurrences;

CREATE POLICY "Users can view household recurring occurrences" ON recurring_occurrences
  FOR SELECT
  USING (
    rule_id IN (
      SELECT id FROM recurring_rules
      WHERE household_id = get_my_household_id()
         OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert household recurring occurrences" ON recurring_occurrences
  FOR INSERT
  WITH CHECK (
    rule_id IN (
      SELECT id FROM recurring_rules
      WHERE household_id = get_my_household_id()
         OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update household recurring occurrences" ON recurring_occurrences
  FOR UPDATE
  USING (
    rule_id IN (
      SELECT id FROM recurring_rules
      WHERE household_id = get_my_household_id()
         OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    rule_id IN (
      SELECT id FROM recurring_rules
      WHERE household_id = get_my_household_id()
         OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can delete household recurring occurrences" ON recurring_occurrences
  FOR DELETE
  USING (
    rule_id IN (
      SELECT id FROM recurring_rules
      WHERE household_id = get_my_household_id()
         OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    )
  );
