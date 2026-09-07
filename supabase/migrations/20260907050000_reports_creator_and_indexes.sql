-- 1. Ensure generated_by column exists on monthly_reports and periodic_reports
DO $$ BEGIN
  ALTER TABLE monthly_reports ADD COLUMN IF NOT EXISTS generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE periodic_reports ADD COLUMN IF NOT EXISTS generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL; END $$;

-- 2. Performance Indexes for report queries by household and generator
CREATE INDEX IF NOT EXISTS idx_monthly_reports_household ON monthly_reports(household_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_generated_by ON monthly_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_household ON periodic_reports(household_id);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_generated_by ON periodic_reports(generated_by);
