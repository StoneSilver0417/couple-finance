-- 1. Ensure expense_type column exists on recurring_rules with valid check constraints
DO $$ BEGIN
  ALTER TABLE recurring_rules ADD COLUMN IF NOT EXISTS expense_type TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

-- 2. Validate check constraint for expense_type values
DO $$ BEGIN
  ALTER TABLE recurring_rules DROP CONSTRAINT IF EXISTS recurring_rules_expense_type_check;
  ALTER TABLE recurring_rules ADD CONSTRAINT recurring_rules_expense_type_check CHECK (expense_type IN ('fixed', 'variable', 'irregular'));
EXCEPTION WHEN others THEN NULL; END $$;

-- 3. Validate constraint for income/expense type correspondence
DO $$ BEGIN
  ALTER TABLE recurring_rules DROP CONSTRAINT IF EXISTS recurring_rules_income_expense_type_check;
  ALTER TABLE recurring_rules ADD CONSTRAINT recurring_rules_income_expense_type_check CHECK ((type = 'income' AND expense_type IS NULL) OR (type = 'expense' AND expense_type IS NOT NULL));
EXCEPTION WHEN others THEN NULL; END $$;
