-- 기존 정책: 자기 프로필만 조회 가능 → 같은 가구 멤버도 조회 가능하도록 변경
-- RLS 서브쿼리 재귀 문제 방지를 위해 SECURITY DEFINER 함수 사용
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view household member profiles" ON profiles;

CREATE OR REPLACE FUNCTION get_my_household_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT household_id FROM profiles WHERE id = auth.uid()
$$;

CREATE POLICY "Users can view household member profiles" ON profiles FOR SELECT
USING (
  auth.uid() = id
  OR household_id = get_my_household_id()
);
