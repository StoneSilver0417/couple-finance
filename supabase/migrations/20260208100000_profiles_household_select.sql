-- 기존 정책: 자기 프로필만 조회 가능 → 같은 가구 멤버도 조회 가능하도록 변경
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view household member profiles" ON profiles FOR SELECT
USING (
  auth.uid() = id
  OR household_id IN (
    SELECT household_id FROM profiles WHERE id = auth.uid()
  )
);
