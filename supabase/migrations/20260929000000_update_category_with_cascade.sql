-- Migration: add update_category_with_cascade RPC
-- Atomically updates category metadata (name/icon/color/expense_category)
-- and cascades expense_category changes to linked transactions.expense_type
-- and recurring_rules.expense_type.
--
-- Security model:
--   - SECURITY DEFINER: runs with owner privileges to bypass RLS for atomic updates
--   - auth.uid() check: only authenticated users may call this
--   - household membership check: user must belong to the category's household
--   - category ownership check: category must belong to the household
--   - category lock: FOR UPDATE prevents concurrent modifications
--   - type guard: only expense categories may have expense_category changed
--   - subtype validation: expense_category must be fixed/variable/irregular

DROP FUNCTION IF EXISTS update_category_with_cascade(UUID, UUID, TEXT, TEXT, TEXT, TEXT);

CREATE FUNCTION update_category_with_cascade(
  p_category_id   UUID,
  p_household_id  UUID,
  p_name          TEXT,
  p_icon          TEXT,
  p_color         TEXT,
  p_expense_category TEXT  -- NULL for income categories; 'fixed'|'variable'|'irregular' for expense
) RETURNS VOID AS $$
DECLARE
  v_category_type        TEXT;
  v_old_expense_category TEXT;
BEGIN
  -- 1. Auth check: caller must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: not authenticated';
  END IF;

  -- 2. Household membership check
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND household_id = p_household_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: user does not belong to this household';
  END IF;

  -- 3. Lock the category row and read its type + current subtype
  SELECT type, expense_category
    INTO v_category_type, v_old_expense_category
    FROM categories
   WHERE id = p_category_id
     AND household_id = p_household_id
     AND is_hidden = FALSE
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category not found or access denied';
  END IF;

  -- 4. Validate expense_category against category type
  IF NULLIF(BTRIM(p_name), '') IS NULL
     OR NULLIF(BTRIM(p_icon), '') IS NULL
     OR NULLIF(BTRIM(p_color), '') IS NULL THEN
    RAISE EXCEPTION 'Category metadata is required';
  END IF;

  IF v_category_type = 'expense' AND p_expense_category IS NULL THEN
    RAISE EXCEPTION 'expense_category is required for expense categories';
  END IF;

  IF p_expense_category IS NOT NULL AND v_category_type <> 'expense' THEN
    RAISE EXCEPTION 'expense_category can only be set on expense categories';
  END IF;

  IF v_category_type = 'expense' AND p_expense_category IS NOT NULL
     AND p_expense_category NOT IN ('fixed', 'variable', 'irregular') THEN
    RAISE EXCEPTION 'Invalid expense_category value: must be fixed, variable, or irregular';
  END IF;

  -- 5. Update category metadata (name, icon, color, expense_category)
  UPDATE categories
     SET name             = p_name,
         icon             = p_icon,
         color            = p_color,
         expense_category = CASE
                              WHEN v_category_type = 'expense' THEN p_expense_category
                              ELSE expense_category  -- income: leave unchanged
                            END,
         updated_at       = NOW()
   WHERE id = p_category_id
     AND household_id = p_household_id;

  -- 6. Cascade: if expense_category changed, update linked transactions
  IF v_category_type = 'expense'
     AND p_expense_category IS NOT NULL
     AND p_expense_category IS DISTINCT FROM v_old_expense_category THEN

    UPDATE transactions
       SET expense_type = p_expense_category,
           updated_at   = NOW()
     WHERE category_id  = p_category_id
       AND household_id = p_household_id
       AND type         = 'expense';

    -- 7. Cascade: update linked recurring_rules expense_type
    UPDATE recurring_rules
       SET expense_type = p_expense_category,
           updated_at   = NOW()
     WHERE category_id  = p_category_id
       AND household_id = p_household_id
       AND type         = 'expense';

  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Restrict access: only authenticated users may call this function
REVOKE EXECUTE ON FUNCTION update_category_with_cascade(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_category_with_cascade(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
