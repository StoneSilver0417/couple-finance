-- 자산 소유권 타입 추가
-- owner_type: 'JOINT' (공동), 'INDIVIDUAL' (개인), 'CHILD' (자녀)

-- 컬럼 추가
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS owner_type TEXT DEFAULT 'JOINT' CHECK (owner_type IN ('JOINT', 'INDIVIDUAL', 'CHILD'));

-- 개인 자산인 경우 소유자 ID 저장
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS owner_profile_id UUID REFERENCES profiles(id);

-- 자녀 자산인 경우 자녀 이름 저장
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS child_name TEXT;

-- 기존 자산은 모두 JOINT로 설정 (이미 DEFAULT로 설정됨)
UPDATE assets SET owner_type = 'JOINT' WHERE owner_type IS NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_assets_owner_type ON assets(owner_type);
CREATE INDEX IF NOT EXISTS idx_assets_owner_profile ON assets(owner_profile_id);
