DROP FUNCTION IF EXISTS create_transaction_with_recurring_rule(
  UUID, UUID, TEXT, NUMERIC, UUID, DATE, TEXT, TEXT, INTEGER, DATE
);

CREATE FUNCTION create_transaction_with_recurring_rule(
  p_household_id UUID,
  p_user_id UUID,
  p_type TEXT,
  p_amount NUMERIC,
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
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id AND household_id = p_household_id
  ) THEN
    RAISE EXCEPTION 'User does not belong to the specified household';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM categories
    WHERE id = p_category_id
      AND household_id = p_household_id
      AND type = p_type
      AND (p_type = 'income' OR expense_category = p_expense_type)
  ) THEN
    RAISE EXCEPTION 'Invalid category for the specified household and type';
  END IF;

  INSERT INTO recurring_rules (
    household_id, user_id, type, expense_type, amount, category_id, memo,
    target_day, start_date, end_date, is_active
  ) VALUES (
    p_household_id, p_user_id, p_type, p_expense_type, p_amount,
    p_category_id, p_memo, p_target_day, p_transaction_date, p_end_date, TRUE
  ) RETURNING id INTO v_rule_id;

  INSERT INTO transactions (
    household_id, user_id, type, expense_type, amount, category_id,
    transaction_date, memo, is_recurring, recurring_rule_id
  ) VALUES (
    p_household_id, p_user_id, p_type, p_expense_type, p_amount,
    p_category_id, p_transaction_date, p_memo, FALSE, v_rule_id
  ) RETURNING id INTO v_transaction_id;

  INSERT INTO recurring_occurrences (
    rule_id, transaction_id, target_year, target_month
  ) VALUES (
    v_rule_id,
    v_transaction_id,
    EXTRACT(YEAR FROM p_transaction_date)::INTEGER,
    EXTRACT(MONTH FROM p_transaction_date)::INTEGER
  );

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION create_transaction_with_recurring_rule(
  UUID, UUID, TEXT, NUMERIC, UUID, DATE, TEXT, TEXT, INTEGER, DATE
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_transaction_with_recurring_rule(
  UUID, UUID, TEXT, NUMERIC, UUID, DATE, TEXT, TEXT, INTEGER, DATE
) TO authenticated;

CREATE OR REPLACE FUNCTION enable_transaction_recurring_rule(
  p_transaction_id UUID,
  p_household_id UUID,
  p_user_id UUID,
  p_type TEXT,
  p_amount NUMERIC,
  p_category_id UUID,
  p_transaction_date DATE,
  p_expense_type TEXT,
  p_memo TEXT,
  p_target_day INTEGER,
  p_end_date DATE
) RETURNS UUID AS $$
DECLARE
  v_rule_id UUID;
  v_existing_rule_id UUID;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id AND household_id = p_household_id
  ) THEN
    RAISE EXCEPTION 'User does not belong to the specified household';
  END IF;

  SELECT recurring_rule_id
  INTO v_existing_rule_id
  FROM transactions
  WHERE id = p_transaction_id
    AND household_id = p_household_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  IF v_existing_rule_id IS NOT NULL THEN
    RAISE EXCEPTION 'Transaction already has a recurring rule';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM categories
    WHERE id = p_category_id
      AND household_id = p_household_id
      AND type = p_type
      AND (p_type = 'income' OR expense_category = p_expense_type)
  ) THEN
    RAISE EXCEPTION 'Invalid category for the specified household and type';
  END IF;

  INSERT INTO recurring_rules (
    household_id, user_id, type, expense_type, amount, category_id, memo,
    target_day, start_date, end_date, is_active
  ) VALUES (
    p_household_id, p_user_id, p_type, p_expense_type, p_amount,
    p_category_id, p_memo, p_target_day, p_transaction_date, p_end_date, TRUE
  ) RETURNING id INTO v_rule_id;

  UPDATE transactions
  SET type = p_type,
      expense_type = p_expense_type,
      amount = p_amount,
      category_id = p_category_id,
      transaction_date = p_transaction_date,
      memo = p_memo,
      recurring_rule_id = v_rule_id,
      is_recurring = FALSE,
      updated_at = NOW()
  WHERE id = p_transaction_id
    AND household_id = p_household_id;

  INSERT INTO recurring_occurrences (
    rule_id, transaction_id, target_year, target_month
  ) VALUES (
    v_rule_id,
    p_transaction_id,
    EXTRACT(YEAR FROM p_transaction_date)::INTEGER,
    EXTRACT(MONTH FROM p_transaction_date)::INTEGER
  );

  RETURN v_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION enable_transaction_recurring_rule(
  UUID, UUID, UUID, TEXT, NUMERIC, UUID, DATE, TEXT, TEXT, INTEGER, DATE
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION enable_transaction_recurring_rule(
  UUID, UUID, UUID, TEXT, NUMERIC, UUID, DATE, TEXT, TEXT, INTEGER, DATE
) TO authenticated;

INSERT INTO recurring_occurrences (rule_id, transaction_id, target_year, target_month)
SELECT DISTINCT ON (
  tx.recurring_rule_id,
  EXTRACT(YEAR FROM tx.transaction_date),
  EXTRACT(MONTH FROM tx.transaction_date)
)
  tx.recurring_rule_id,
  tx.id,
  EXTRACT(YEAR FROM tx.transaction_date)::INTEGER,
  EXTRACT(MONTH FROM tx.transaction_date)::INTEGER
FROM transactions AS tx
WHERE tx.recurring_rule_id IS NOT NULL
ORDER BY
  tx.recurring_rule_id,
  EXTRACT(YEAR FROM tx.transaction_date),
  EXTRACT(MONTH FROM tx.transaction_date),
  tx.created_at
ON CONFLICT (rule_id, target_year, target_month) DO NOTHING;

NOTIFY pgrst, 'reload schema';
