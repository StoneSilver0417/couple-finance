-- 1. activity_logs 테이블의 target_table 체크 제약조건에 RECURRING_RULE 추가
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_target_table_check;
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_target_table_check
  CHECK (target_table IN ('TRANSACTION', 'ASSET', 'BUDGET', 'CATEGORY', 'RECURRING_RULE'));

-- 2. monthly_balances RLS 정책 강화 (부부 상호 관리 지원)
DROP POLICY IF EXISTS "Users can manage household monthly balances" ON monthly_balances;

CREATE POLICY "Users can manage household monthly balances" ON monthly_balances
  FOR ALL
  USING (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

-- 3. monthly_budgets RLS 정책 강화
DROP POLICY IF EXISTS "Users can view their household's monthly budgets" ON monthly_budgets;
DROP POLICY IF EXISTS "Users can insert their household's monthly budgets" ON monthly_budgets;
DROP POLICY IF EXISTS "Users can update their household's monthly budgets" ON monthly_budgets;
DROP POLICY IF EXISTS "Users can delete their household's monthly budgets" ON monthly_budgets;

CREATE POLICY "Users can view their household's monthly budgets" ON monthly_budgets
  FOR SELECT
  USING (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert their household's monthly budgets" ON monthly_budgets
  FOR INSERT
  WITH CHECK (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their household's monthly budgets" ON monthly_budgets
  FOR UPDATE
  USING (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete their household's monthly budgets" ON monthly_budgets
  FOR DELETE
  USING (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

-- 4. budgets RLS 정책 강화
DROP POLICY IF EXISTS "Users can manage household budgets" ON budgets;

CREATE POLICY "Users can manage household budgets" ON budgets
  FOR ALL
  USING (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

-- 5. activity_logs RLS 정책 강화
DROP POLICY IF EXISTS "Users can view their household activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can insert activity logs for their household" ON activity_logs;

CREATE POLICY "Users can view their household activity logs" ON activity_logs
  FOR SELECT
  USING (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert activity logs for their household" ON activity_logs
  FOR INSERT
  WITH CHECK (
    household_id = get_my_household_id()
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );
