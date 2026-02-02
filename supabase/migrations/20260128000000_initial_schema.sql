-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Households
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly Balances
CREATE TABLE monthly_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  carry_over_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  income_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  expense_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, year, month)
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  expense_category TEXT CHECK (expense_category IN ('fixed', 'variable', 'irregular')),
  color TEXT,
  icon TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  expense_type TEXT CHECK (expense_type IN ('fixed', 'variable', 'irregular')),
  amount DECIMAL(12, 2) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL,
  memo TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  budget_amount DECIMAL(12, 2) NOT NULL,
  actual_amount DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, category_id, year, month)
);

-- Assets
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'savings', 'child', 'investment', 'cash', 'other'
  current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  is_liability BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Enablement
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Households
CREATE POLICY "Users can view own household" ON households FOR SELECT USING (id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

-- Monthly Balances
CREATE POLICY "Users can manage household monthly balances" ON monthly_balances FOR ALL USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

-- Transactions
CREATE POLICY "Users can view household transactions" ON transactions FOR SELECT USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert household transactions" ON transactions FOR INSERT WITH CHECK (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Users can update household transactions" ON transactions FOR UPDATE USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete household transactions" ON transactions FOR DELETE USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

-- Categories
CREATE POLICY "Users can manage household categories" ON categories FOR ALL USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

-- Budgets
CREATE POLICY "Users can manage household budgets" ON budgets FOR ALL USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

-- Assets
CREATE POLICY "Users can manage household assets" ON assets FOR ALL USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

-- Seeding Function for Default Categories
CREATE OR REPLACE FUNCTION create_default_categories(p_household_id UUID)
RETURNS VOID AS $$
BEGIN
  -- 수입 카테고리
  INSERT INTO categories (household_id, name, type, color, icon, display_order) VALUES
    (p_household_id, '월급', 'income', '#10B981', '💰', 1),
    (p_household_id, '상여', 'income', '#10B981', '🎁', 2),
    (p_household_id, '수당', 'income', '#10B981', '💵', 3),
    (p_household_id, '기타 수입', 'income', '#10B981', '💸', 4);
  
  -- 고정 지출 카테고리
  INSERT INTO categories (household_id, name, type, expense_category, color, icon, display_order) VALUES
    (p_household_id, '대출상환', 'expense', 'fixed', '#EF4444', '🏦', 1),
    (p_household_id, '임차료', 'expense', 'fixed', '#EF4444', '🏠', 2),
    (p_household_id, '아파트관리비', 'expense', 'fixed', '#EF4444', '🏢', 3),
    (p_household_id, '공과금', 'expense', 'fixed', '#EF4444', '💡', 4),
    (p_household_id, '통신비', 'expense', 'fixed', '#EF4444', '📱', 5),
    (p_household_id, '교육비', 'expense', 'fixed', '#EF4444', '📚', 6),
    (p_household_id, '보험료', 'expense', 'fixed', '#EF4444', '🛡️', 7);
  
  -- 변동 지출 카테고리
  INSERT INTO categories (household_id, name, type, expense_category, color, icon, display_order) VALUES
    (p_household_id, '식비', 'expense', 'variable', '#F59E0B', '🍚', 1),
    (p_household_id, '외식비', 'expense', 'variable', '#F59E0B', '🍔', 2),
    (p_household_id, '생필품', 'expense', 'variable', '#F59E0B', '🧴', 3),
    (p_household_id, '건강/의료', 'expense', 'variable', '#F59E0B', '💊', 4),
    (p_household_id, '아기', 'expense', 'variable', '#F59E0B', '👶', 5),
    (p_household_id, '교통비', 'expense', 'variable', '#F59E0B', '🚗', 6),
    (p_household_id, '문화/여가', 'expense', 'variable', '#F59E0B', '🎬', 7),
    (p_household_id, '쇼핑', 'expense', 'variable', '#F59E0B', '🛍️', 8);
  
  -- 비정기 지출 카테고리
  INSERT INTO categories (household_id, name, type, expense_category, color, icon, display_order) VALUES
    (p_household_id, '경조사비', 'expense', 'irregular', '#8B5CF6', '💐', 1),
    (p_household_id, '세금', 'expense', 'irregular', '#8B5CF6', '📋', 2),
    (p_household_id, '자동차', 'expense', 'irregular', '#8B5CF6', '🚙', 3),
    (p_household_id, '대형구매', 'expense', 'irregular', '#8B5CF6', '📦', 4),
    (p_household_id, '기타', 'expense', 'irregular', '#8B5CF6', '📝', 5);
END;
$$ LANGUAGE plpgsql;
