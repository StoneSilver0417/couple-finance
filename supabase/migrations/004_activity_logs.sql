-- Activity Logs 테이블 생성
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
  target_table TEXT NOT NULL CHECK (target_table IN ('TRANSACTION', 'ASSET', 'BUDGET', 'CATEGORY')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_activity_logs_household ON activity_logs(household_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- RLS 정책
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their household activity logs"
ON activity_logs FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert activity logs for their household"
ON activity_logs FOR INSERT
WITH CHECK (
  household_id IN (
    SELECT household_id FROM profiles WHERE id = auth.uid()
  )
);
