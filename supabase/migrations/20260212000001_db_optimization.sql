-- Supabase DB 아키텍처 개선 및 성능 최적화 마이그레이션

-- 1. Updated At 자동 갱신 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. 각 테이블에 트리거 적용
-- households
DO $$ BEGIN
    CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN others THEN NULL; END $$;

-- profiles
DO $$ BEGIN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN others THEN NULL; END $$;

-- transactions
DO $$ BEGIN
    CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN others THEN NULL; END $$;

-- categories
DO $$ BEGIN
    CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN others THEN NULL; END $$;

-- monthly_balances
DO $$ BEGIN
    CREATE TRIGGER update_monthly_balances_updated_at BEFORE UPDATE ON monthly_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN others THEN NULL; END $$;

-- budgets
DO $$ BEGIN
    CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN others THEN NULL; END $$;

-- assets
DO $$ BEGIN
    CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN others THEN NULL; END $$;

-- payment_methods
DO $$ BEGIN
    CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN others THEN NULL; END $$;

-- 3. 성능 최적화를 위한 인덱스(Index) 생성
-- 조회 성능 비약적 향상
CREATE INDEX IF NOT EXISTS idx_profiles_household_id ON public.profiles(household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_household_id_date ON public.transactions(household_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_household_id ON public.categories(household_id);
CREATE INDEX IF NOT EXISTS idx_monthly_balances_household_id ON public.monthly_balances(household_id);
CREATE INDEX IF NOT EXISTS idx_budgets_household_id ON public.budgets(household_id);
CREATE INDEX IF NOT EXISTS idx_assets_household_id ON public.assets(household_id);

-- 4. 관리자 권한 구조 개선 ( profiles 테이블에 is_admin 추가 )
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 기존 관리자 계정 권한 부여
UPDATE public.profiles 
SET is_admin = TRUE 
WHERE email IN ('waterdrop11@naver.com', 'admin@example.com');

-- 5. feedbacks 테이블 RLS 정책을 이메일 조회 대신 is_admin 필드 기반으로 고도화
DROP POLICY IF EXISTS "Admins can view all feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Admins can update feedbacks" ON public.feedbacks;

CREATE POLICY "Admins can view all feedbacks"
    ON public.feedbacks FOR SELECT
    USING (
      (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
    );

CREATE POLICY "Admins can update feedbacks"
    ON public.feedbacks FOR UPDATE
    USING (
      (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
    );

-- 6. 새 사용자 가입 시 프로필 자동 생성 트리거 (보안 강화)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, is_admin)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        CASE WHEN NEW.email IN ('waterdrop11@naver.com', 'admin@example.com') THEN TRUE ELSE FALSE END
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 가입 트리거 연결
DO $$ BEGIN
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN others THEN NULL; END $$;
