-- 회원가입 후 가구 생성이 안 되는 문제 수정
-- 원인: households, profiles 테이블에 INSERT RLS 정책 누락

-- ============================================
-- 1. households INSERT 정책 추가
-- 인증된 사용자는 가구를 생성할 수 있음
-- ============================================
CREATE POLICY "Authenticated users can create households"
  ON households
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 2. profiles INSERT 정책 추가
-- 사용자는 자신의 프로필만 생성할 수 있음
-- ============================================
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 3. 가구 생성 통합 함수 (SECURITY DEFINER)
-- RLS를 우회하여 가구 + 프로필 + 기본 카테고리 + 결제수단을 한번에 생성
-- ============================================
CREATE OR REPLACE FUNCTION create_household_with_owner(
  p_user_id UUID,
  p_user_email TEXT,
  p_user_name TEXT,
  p_household_name TEXT,
  p_invite_code TEXT
)
RETURNS UUID AS $$
DECLARE
  v_household_id UUID;
BEGIN
  -- 1. 가구 생성
  INSERT INTO households (name, invite_code)
  VALUES (p_household_name, p_invite_code)
  RETURNING id INTO v_household_id;

  -- 2. 프로필 생성 (OWNER)
  INSERT INTO profiles (id, email, full_name, household_id, role)
  VALUES (p_user_id, p_user_email, p_user_name, v_household_id, 'OWNER')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    household_id = EXCLUDED.household_id,
    role = EXCLUDED.role,
    updated_at = NOW();

  -- 3. 기본 카테고리 생성
  PERFORM create_default_categories(v_household_id);

  -- 4. 기본 결제 수단 생성
  PERFORM create_default_payment_methods(v_household_id);

  RETURN v_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. 가구 참여 함수 (SECURITY DEFINER)
-- ============================================
CREATE OR REPLACE FUNCTION join_household_as_member(
  p_user_id UUID,
  p_user_email TEXT,
  p_user_name TEXT,
  p_invite_code TEXT
)
RETURNS JSON AS $$
DECLARE
  v_household_id UUID;
  v_member_count INT;
BEGIN
  -- 1. 초대 코드로 가구 찾기
  SELECT id INTO v_household_id
  FROM households
  WHERE invite_code = p_invite_code;

  IF v_household_id IS NULL THEN
    RETURN json_build_object('error', '유효하지 않은 초대 코드입니다.');
  END IF;

  -- 2. 기존 멤버 수 확인
  SELECT COUNT(*) INTO v_member_count
  FROM profiles
  WHERE household_id = v_household_id;

  IF v_member_count >= 2 THEN
    RETURN json_build_object('error', '이미 2명의 구성원이 있는 가구입니다.');
  END IF;

  -- 3. 프로필 생성 (MEMBER)
  INSERT INTO profiles (id, email, full_name, household_id, role)
  VALUES (p_user_id, p_user_email, p_user_name, v_household_id, 'MEMBER')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    household_id = EXCLUDED.household_id,
    role = EXCLUDED.role,
    updated_at = NOW();

  RETURN json_build_object('success', true, 'household_id', v_household_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
