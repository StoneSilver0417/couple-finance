-- Add profiles relationship for feedbacks (if not automatically created)
-- Usually fk creates relationship, but for clarity:

alter table public.feedbacks
add constraint feedbacks_user_id_fkey
foreign key (user_id)
references public.profiles (id)
on delete set null;

-- Admin Policy: Allow admin email to read/update all feedbacks
-- (Currently RLS is simple user-based. For admin, we need a special policy or just use service role key in pure backend context)
-- But here we use standard client so we need RLS policy for specific email.

CREATE POLICY "Admins can view all feedbacks"
    ON public.feedbacks FOR SELECT
    USING (
      auth.uid() IN (
        -- 2026-07-15: 공개 저장소 전환에 따라 실제 관리자 이메일을 마스킹 (이 정책은
        -- 20260212000001_db_optimization.sql에서 is_admin 컬럼 기반으로 이미 대체됨)
        SELECT id FROM auth.users WHERE email IN ('<REDACTED_ADMIN_EMAIL>', 'admin@example.com')
      )
    );

CREATE POLICY "Admins can update feedbacks"
    ON public.feedbacks FOR UPDATE
    USING (
      auth.uid() IN (
        -- 2026-07-15: 공개 저장소 전환에 따라 실제 관리자 이메일을 마스킹 (이 정책은
        -- 20260212000001_db_optimization.sql에서 is_admin 컬럼 기반으로 이미 대체됨)
        SELECT id FROM auth.users WHERE email IN ('<REDACTED_ADMIN_EMAIL>', 'admin@example.com')
      )
    );
