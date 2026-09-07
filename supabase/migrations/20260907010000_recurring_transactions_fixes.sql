-- 1. Add constraints to recurring_rules
ALTER TABLE recurring_rules ADD CONSTRAINT recurring_rules_amount_check CHECK (amount > 0);
ALTER TABLE recurring_rules ADD CONSTRAINT recurring_rules_dates_check CHECK (end_date IS NULL OR end_date >= start_date);
ALTER TABLE recurring_rules ADD CONSTRAINT recurring_rules_income_expense_type_check CHECK ((type = 'income' AND expense_type IS NULL) OR (type = 'expense' AND expense_type IS NOT NULL));

-- 2. Create RPC for atomic transaction + recurring rule creation
CREATE OR REPLACE FUNCTION create_transaction_with_recurring_rule(
  p_household_id UUID,
  p_user_id UUID,
  p_type TEXT,
  p_amount DECIMAL,
  p_category_id UUID,
  p_transaction_date DATE,
  p_expense_type TEXT,
  p_memo TEXT,
  p_target_day INTEGER,
  p_end_date DATE
) RETURNS UUID AS $$
DECLARE
  v_rule_id UUID;
  v_transaction_id UUID;
  v_category_valid BOOLEAN;
  v_year INTEGER;
  v_month INTEGER;
BEGIN
  -- Authenticate
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validate household
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND household_id = p_household_id) THEN
    RAISE EXCEPTION 'User does not belong to the specified household';
  END IF;

  -- Validate category
  SELECT EXISTS (
    SELECT 1 FROM categories 
    WHERE id = p_category_id 
      AND household_id = p_household_id 
      AND type = p_type 
      AND (p_type = 'income' OR expense_category = p_expense_type)
  ) INTO v_category_valid;

  IF NOT v_category_valid THEN
    RAISE EXCEPTION 'Invalid category for the specified household and type';
  END IF;

  -- Insert recurring rule
  INSERT INTO recurring_rules (
    household_id,
    user_id,
    type,
    expense_type,
    amount,
    category_id,
    memo,
    target_day,
    start_date,
    end_date,
    is_active
  ) VALUES (
    p_household_id,
    p_user_id,
    p_type,
    p_expense_type,
    p_amount,
    p_category_id,
    p_memo,
    p_target_day,
    p_transaction_date,
    p_end_date,
    TRUE
  ) RETURNING id INTO v_rule_id;

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
    p_household_id,
    p_user_id,
    p_type,
    p_expense_type,
    p_amount,
    p_category_id,
    p_transaction_date,
    p_memo,
    FALSE, -- The initial transaction is manually created, but linked to the rule
    v_rule_id
  ) RETURNING id INTO v_transaction_id;

  -- Insert occurrence for the current month to prevent materialization duplication
  v_year := EXTRACT(YEAR FROM p_transaction_date);
  v_month := EXTRACT(MONTH FROM p_transaction_date);

  INSERT INTO recurring_occurrences (
    rule_id,
    transaction_id,
    target_year,
    target_month
  ) VALUES (
    v_rule_id,
    v_transaction_id,
    v_year,
    v_month
  );

  RETURN v_transaction_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION create_transaction_with_recurring_rule(UUID, UUID, TEXT, DECIMAL, UUID, DATE, TEXT, TEXT, INTEGER, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_transaction_with_recurring_rule(UUID, UUID, TEXT, DECIMAL, UUID, DATE, TEXT, TEXT, INTEGER, DATE) TO authenticated;

-- 3. Update materialize_monthly_recurring_transactions to validate category consistency
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
  v_category_valid BOOLEAN;
BEGIN
  -- Validate year and month
  IF p_year < 2000 OR p_year > 2100 OR p_month < 1 OR p_month > 12 THEN
    RAISE EXCEPTION 'Invalid year or month';
  END IF;

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
  
  -- Get the last day of the target month
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
      
      -- Validate category consistency
      SELECT EXISTS (
        SELECT 1 FROM categories 
        WHERE id = v_rule.category_id 
          AND household_id = v_household_id 
          AND type = v_rule.type 
          AND (v_rule.type = 'income' OR expense_category = v_rule.expense_type)
      ) INTO v_category_valid;

      IF NOT v_category_valid THEN
        -- Skip if category is invalid or deleted
        CONTINUE;
      END IF;

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
$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
