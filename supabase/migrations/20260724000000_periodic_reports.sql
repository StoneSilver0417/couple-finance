-- 분기/반기/연간 AI 분석 보고서
-- 운영 DB에는 자동 적용하지 않으며, 검토 후 Supabase Dashboard SQL Editor에서 수동 실행한다.
CREATE TABLE periodic_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('quarter', 'half', 'year')),
  year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  period_key TEXT NOT NULL,
  content JSONB NOT NULL,
  model TEXT NOT NULL,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(household_id, period_type, period_key)
);

ALTER TABLE periodic_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage household periodic reports"
  ON periodic_reports
  FOR ALL
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );
