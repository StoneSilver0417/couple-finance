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
        SELECT id FROM auth.users WHERE email IN ('waterdrop11@naver.com', 'admin@example.com')
      )
    );

CREATE POLICY "Admins can update feedbacks"
    ON public.feedbacks FOR UPDATE
    USING (
      auth.uid() IN (
        SELECT id FROM auth.users WHERE email IN ('waterdrop11@naver.com', 'admin@example.com')
      )
    );
