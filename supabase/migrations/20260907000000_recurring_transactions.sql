-- 1. Create recurring_rules table
CREATE TABLE recurring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  expense_type TEXT CHECK (expense_type IN ('fixed', 'variable', 'irregular')),
  amount DECIMAL(12, 2) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  memo TEXT,
  target_day INTEGER NOT NULL CHECK (target_day BETWEEN 1 AND 31),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create recurring_occurrences table
CREATE TABLE recurring_occurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES recurring_rules(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL, -- Will add FK after altering transactions
  target_year INTEGER NOT NULL,
  target_month INTEGER NOT NULL CHECK (target_month BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rule_id, target_year, target_month)
);

-- 3. Alter transactions table
ALTER TABLE transactions ADD COLUMN recurring_rule_id UUID REFERENCES recurring_rules(id) ON DELETE SET NULL;

-- Add FK to recurring_occurrences
ALTER TABLE recurring_occurrences ADD CONSTRAINT fk_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE;

-- 4. Indexes
CREATE INDEX idx_recurring_rules_household ON recurring_rules(household_id);
CREATE INDEX idx_recurring_rules_active ON recurring_rules(household_id) WHERE is_active = TRUE;
CREATE INDEX idx_recurring_occurrences_rule ON recurring_occurrences(rule_id);
CREATE INDEX idx_transactions_recurring_rule ON transactions(recurring_rule_id);

-- 5. RLS Enablement
ALTER TABLE recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_occurrences ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- recurring_rules
CREATE POLICY "Users can view household recurring rules" ON recurring_rules FOR SELECT USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert household recurring rules" ON recurring_rules FOR INSERT WITH CHECK (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Users can update household recurring rules" ON recurring_rules FOR UPDATE USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete household recurring rules" ON recurring_rules FOR DELETE USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

-- recurring_occurrences
CREATE POLICY "Users can view household recurring occurrences" ON recurring_occurrences FOR SELECT USING (rule_id IN (SELECT id FROM recurring_rules WHERE household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Users can insert household recurring occurrences" ON recurring_occurrences FOR INSERT WITH CHECK (rule_id IN (SELECT id FROM recurring_rules WHERE household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Users can update household recurring occurrences" ON recurring_occurrences FOR UPDATE USING (rule_id IN (SELECT id FROM recurring_rules WHERE household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Users can delete household recurring occurrences" ON recurring_occurrences FOR DELETE USING (rule_id IN (SELECT id FROM recurring_rules WHERE household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())));

-- 7. RPC for materializing monthly recurring transactions
CREATE OR REPLACE FUNCTION materialize_monthly_recurring_transactions(p_year INTEGER, p_month INTEGER)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_household_id UUID;
  v_rule RECORD;
  v_target_date DATE;
  v_last_day_of_month INTEGER;
  v_transaction_id UUID;
  v_processed_count INTEGER := 0;
  v_month_start DATE;
  v_month_end DATE;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get user's household
  SELECT household_id INTO v_household_id FROM profiles WHERE id = v_user_id;
  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'User does not belong to a household';
  END IF;

  -- Calculate month boundaries
  v_month_start := make_date(p_year, p_month, 1);
  v_month_end := (v_month_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Get the last day of the target month (e.g., 28, 29, 30, 31)
  v_last_day_of_month := EXTRACT(DAY FROM v_month_end);

  -- Loop through active rules for the household
  FOR v_rule IN 
    SELECT * FROM recurring_rules 
    WHERE household_id = v_household_id 
      AND is_active = TRUE
      AND start_date <= v_month_end
      AND (end_date IS NULL OR end_date >= v_month_start)
  LOOP
    -- Check if occurrence already exists for this month
    IF NOT EXISTS (
      SELECT 1 FROM recurring_occurrences 
      WHERE rule_id = v_rule.id 
        AND target_year = p_year 
        AND target_month = p_month
    ) THEN
      
      -- Calculate actual transaction date (clamp to month end)
      v_target_date := make_date(
        p_year, 
        p_month, 
        LEAST(v_rule.target_day, v_last_day_of_month)::INTEGER
      );

      -- Skip if the calculated target date is outside the rule's validity period
      IF v_target_date < v_rule.start_date OR (v_rule.end_date IS NOT NULL AND v_target_date > v_rule.end_date) THEN
        CONTINUE;
      END IF;

      BEGIN
        -- Insert transaction
        INSERT INTO transactions (
          household_id,
          user_id,
          type,
          expense_type,
          amount,
          category_id,
          transaction_date,
          memo,
          is_recurring,
          recurring_rule_id
        ) VALUES (
          v_rule.household_id,
          v_rule.user_id,
          v_rule.type,
          v_rule.expense_type,
          v_rule.amount,
          v_rule.category_id,
          v_target_date,
          v_rule.memo,
          TRUE,
          v_rule.id
        ) RETURNING id INTO v_transaction_id;

        -- Insert occurrence
        INSERT INTO recurring_occurrences (
          rule_id,
          transaction_id,
          target_year,
          target_month
        ) VALUES (
          v_rule.id,
          v_transaction_id,
          p_year,
          p_month
        );

        v_processed_count := v_processed_count + 1;
      EXCEPTION WHEN unique_violation THEN
        -- If a concurrent transaction already inserted the occurrence, ignore and continue
        NULL;
      END;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'success', true, 
    'processed_count', v_processed_count,
    'year', p_year,
    'month', p_month
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke execute from public and grant to authenticated
REVOKE EXECUTE ON FUNCTION materialize_monthly_recurring_transactions(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION materialize_monthly_recurring_transactions(INTEGER, INTEGER) TO authenticated;

-- 8. Add updated_at trigger for recurring_rules
DO $$ BEGIN
    CREATE TRIGGER update_recurring_rules_updated_at BEFORE UPDATE ON recurring_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN others THEN NULL; END $$;
