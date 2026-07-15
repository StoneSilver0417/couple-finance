-- 관리자 사용자 현황의 가입일을 실제 Auth 계정 생성일로 교정
CREATE OR REPLACE FUNCTION public.admin_get_user_overview()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  household_id uuid,
  household_name text,
  role text,
  is_admin boolean,
  joined_at timestamptz,
  last_sign_in_at timestamptz,
  last_activity_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF COALESCE(
       (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
       FALSE
     ) IS NOT TRUE THEN
    RAISE EXCEPTION '관리자만 사용할 수 있습니다.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.email::text,
    p.full_name::text,
    p.household_id,
    h.name::text,
    p.role::text,
    p.is_admin,
    COALESCE(u.created_at, p.created_at),
    u.last_sign_in_at,
    a.max_created_at
  FROM public.profiles p
  LEFT JOIN public.households h ON h.id = p.household_id
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN LATERAL (
    SELECT MAX(al.created_at) AS max_created_at
    FROM public.activity_logs al
    WHERE al.user_id = p.id
  ) a ON TRUE
  ORDER BY u.last_sign_in_at DESC NULLS LAST, u.created_at DESC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_user_overview() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_get_user_overview() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_get_user_overview() TO authenticated;
