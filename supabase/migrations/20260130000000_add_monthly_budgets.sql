-- Add monthly_budgets table for total monthly budget
CREATE TABLE monthly_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_budget DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, year, month)
);

-- Add RLS policies
ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their household's monthly budgets"
  ON monthly_budgets FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their household's monthly budgets"
  ON monthly_budgets FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their household's monthly budgets"
  ON monthly_budgets FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their household's monthly budgets"
  ON monthly_budgets FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Add index for faster queries
CREATE INDEX idx_monthly_budgets_household_date ON monthly_budgets(household_id, year, month);
