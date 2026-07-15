-- 보안 수정: 신규 가입 시 특정 이메일에 자동으로 관리자 권한(is_admin=TRUE)을
-- 부여하던 하드코딩 로직 제거.
--
-- 배경: 20260212000001_db_optimization.sql의 handle_new_user()가
--   특정 이메일(운영자 이메일 및 'admin@example.com')로 가입하는 계정에
--   자동으로 is_admin=TRUE를 부여했다. 저장소를 공개로 전환하면서 이 이메일
--   목록이 그대로 노출되므로, 누구든 admin@example.com으로 회원가입만 하면
--   관리자 권한을 얻을 수 있는 상태였다. 이후로는 관리자 권한을 이메일이
--   아니라 신뢰할 수 있는 별도 절차(운영자가 직접 UPDATE)로만 부여한다.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, is_admin)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 이메일이 정확히 'admin@example.com'인 계정이 과거 백도어로 관리자 권한을
-- 이미 획득한 상태라면 즉시 회수한다. 실제 운영자 계정은 이 조건에 해당하지
-- 않으므로 영향을 주지 않는다.
UPDATE public.profiles
SET is_admin = FALSE
WHERE email = 'admin@example.com' AND is_admin = TRUE;
