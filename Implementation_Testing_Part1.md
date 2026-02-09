# 부부 공동 가계부 - 구현 및 테스트 프롬프트 (Part 1)

> PRD v1.2 기반 단계별 구현 및 테스트 가이드
> Google Project IDX, Cursor 등 AI 코딩 도구 활용

---

## 📋 사전 준비

### 필수 계정 및 도구
- [ ] Supabase 계정 (https://supabase.com)
- [ ] Vercel 계정 (배포용)
- [ ] Node.js 18+ 설치
- [ ] Git 설치

---

## 🚀 Phase 1: 프로젝트 초기 설정

### Step 1.1: Next.js 프로젝트 생성

```prompt
Next.js 14 (App Router)를 사용하여 부부 공동 가계부 프로젝트를 생성해줘.

요구사항:
1. TypeScript 사용
2. Tailwind CSS 설정
3. 다음 패키지 설치:
   - @supabase/supabase-js
   - @supabase/ssr
   - @tanstack/react-query
   - zustand
   - recharts
   - date-fns
   - react-hook-form
   - zod
   - lucide-react
   - next-pwa
   - @dnd-kit/core
   - @dnd-kit/sortable

4. 프로젝트 폴더 구조:
   /app
     /(auth)
     /(app)
     /api
   /components
     /ui
     /dashboard
     /transactions
     /budget
     /assets
     /categories
   /lib
   /hooks
   /types

5. Tailwind 설정에 색상 팔레트 추가:
   - income: '#10B981'
   - fixed-expense: '#EF4444'
   - variable-expense: '#F59E0B'
   - irregular-expense: '#8B5CF6'
   - asset: '#3B82F6'

6. 폰트: Pretendard 또는 Inter 사용
```

**테스트:**
```bash
npm run dev
# http://localhost:3000 접속하여 기본 페이지 확인
```

---

### Step 1.2: Supabase 설정

```prompt
Supabase 프로젝트를 설정하고 Next.js와 연동해줘.

1. 환경 변수 파일 (.env.local) 생성:
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

2. Supabase 클라이언트 생성:
   - /lib/supabase/client.ts (클라이언트)
   - /lib/supabase/server.ts (서버)
   - /lib/supabase/middleware.ts (미들웨어)

3. middleware.ts에서 인증 체크
```

---

### Step 1.3: 데이터베이스 스키마

```prompt
Supabase SQL Editor에서 다음 테이블을 생성해줘:

profiles, households, monthly_balances, transactions, categories, 
payment_methods, budgets, assets, asset_snapshots, savings_goals, net_worth_history

각 테이블에 대해:
- 모든 필드 정의
- Primary Key, Foreign Key 설정
- 인덱스 생성

그리고 함수들도 생성:
1. create_default_categories()
2. update_category_usage_count() 트리거

PRD의 "4.1 테이블 구조" 섹션 참고
```

**테스트:**
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'categories';
```

---

### Step 1.4: RLS 정책

```prompt
모든 테이블에 RLS 정책 적용해줘.

각 테이블마다:
1. RLS 활성화
2. SELECT, INSERT, UPDATE, DELETE 정책 (household_id 기반)

PRD의 "4.2 RLS 정책" 참고
```

**테스트:**
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

---

## 🔐 Phase 2: 인증 시스템

### Step 2.1: 회원가입

```prompt
/app/(auth)/signup/page.tsx 생성

요구사항:
1. 이메일/비밀번호 폼
2. react-hook-form + zod 유효성 검증
3. Supabase Auth 회원가입
4. 성공 시 /onboarding 리다이렉트

UI: 깔끔한 카드, 모바일 반응형
```

**테스트 프롬프트:**
```prompt
회원가입 테스트 케이스:
1. ✅ 정상: test@example.com / Test1234!
2. ❌ 잘못된 이메일
3. ❌ 짧은 비밀번호
4. ❌ 비밀번호 불일치
5. ❌ 중복 이메일
```

---

### Step 2.2: 로그인

```prompt
/app/(auth)/login/page.tsx 생성

기능: 이메일/비밀번호 로그인, 비밀번호 찾기 링크
성공 시 /dashboard로 리다이렉트
```

**테스트:**
```prompt
로그인 테스트:
1. ✅ 정상 로그인
2. ❌ 잘못된 비밀번호
3. ❌ 존재하지 않는 계정
4. 세션 토큰 저장 확인
```

---

### Step 2.3: 온보딩

```prompt
/app/(auth)/onboarding/page.tsx 생성

기능:
1. "새로운 가계부 시작" (가구 생성)
   - 가구 이름 입력
   - 6자리 초대 코드 생성
   - households INSERT
   - profiles의 household_id 업데이트
   - create_default_categories() 실행

2. "배우자 초대 받기" (가구 참여)
   - 초대 코드 입력
   - 코드 검증
   - 멤버 수 확인 (최대 2명)
   - profiles의 household_id 업데이트

완료 후 /dashboard 리다이렉트
```

**테스트:**
```prompt
온보딩 테스트:

시나리오 1: 가구 생성
1. 첫 번째 계정 로그인
2. 가구 이름: "우리 가족 가계부"
3. 초대 코드 생성 확인
4. DB household 생성 확인
5. 기본 카테고리 생성 확인 (24개)

시나리오 2: 가구 참여
1. 두 번째 계정 회원가입
2. 첫 번째 계정의 초대 코드 입력
3. 같은 household_id 확인
4. 멤버 수 2명 확인

시나리오 3: 에러
1. 잘못된 초대 코드
2. 이미 2명인 가구의 코드
```

---

## 💰 Phase 3: 거래 관리

### Step 3.1: 거래 입력 폼

```prompt
/app/(app)/transactions/new/page.tsx 생성

필드:
- 날짜 (DatePicker)
- 수입/지출 토글
- 지출 시: 고정/변동/비정기 선택
- 카테고리 (드롭다운)
- 금액 (숫자 키패드)
- 결제수단 (선택)
- 메모 (선택)

동적 UI:
- 수입 선택 시 수입 카테고리만
- 지출 선택 시 타입별 카테고리
- 아이콘과 색상 표시

저장 시:
- transactions INSERT
- /transactions/[month] 리다이렉트

UI: 모바일 최적화, 천 단위 콤마
```

**테스트:**
```prompt
더미 데이터 입력:

1월 수입:
- 2026-01-01, 월급, 5,000,000원
- 2026-01-15, 상여, 2,000,000원

1월 고정 지출:
- 2026-01-05, 임차료, 1,000,000원
- 2026-01-10, 아파트관리비, 200,000원
- 2026-01-15, 공과금, 150,000원
- 2026-01-20, 통신비, 120,000원
- 2026-01-25, 교육비, 300,000원

1월 변동 지출:
- 2026-01-03, 외식비, 85,000원, "회식"
- 2026-01-07, 식비, 250,000원, "장보기"
- 2026-01-12, 교통비, 80,000원
- 2026-01-18, 생필품, 120,000원
- 2026-01-22, 문화/여가, 150,000원, "영화"

1월 비정기 지출:
- 2026-01-28, 경조사비, 100,000원, "결혼식"

각 입력 후:
- DB 확인
- category_id 확인
- 금액 확인

SQL 검증:
SELECT * FROM transactions WHERE household_id = 'your_id' ORDER BY transaction_date;
```

---

### Step 3.2: 월별 거래 목록

```prompt
/app/(app)/transactions/[month]/page.tsx 생성

요구사항:
1. 상단 요약: 이월, 수입총액, 지출총액, 잔액

2. 섹션별 구분:
   - 📥 수입
   - 📤 고정 지출
   - 📤 변동 지출
   - 📤 비정기 지출

3. 거래 카드:
   - 날짜, 카테고리 아이콘+이름, 금액, 메모
   - 편집/삭제 버튼

4. 섹션별 합계

5. 필터: 날짜, 카테고리, 검색

6. 월 선택 드롭다운
```

**테스트:**
```prompt
1월 페이지 테스트:

확인:
1. /transactions/1 접속
2. 모든 더미 데이터 표시 확인
3. 섹션별 확인:
   - 수입: 2건 (7,000,000원)
   - 고정 지출: 5건 (1,770,000원)
   - 변동 지출: 5건 (685,000원)
   - 비정기 지출: 1건 (100,000원)

4. 합계 계산:
   - 수입 총액: 7,000,000원
   - 지출 총액: 2,555,000원
   - 현재 잔액: 4,445,000원

5. 날짜순 정렬
6. 아이콘과 색상 확인

필터 테스트:
1. "외식비" 필터링
2. 1/1~1/15 날짜 필터
3. "회식" 검색
```

---

### Step 3.3: 거래 수정/삭제

```prompt
거래 수정 및 삭제 기능 구현

수정:
- 편집 버튼 → 모달/새 페이지
- 기존 데이터 pre-fill
- UPDATE 쿼리
- 낙관적 업데이트

삭제:
- 삭제 버튼 → 확인 다이얼로그
- DELETE 쿼리
- 낙관적 삭제

권한: RLS로 household_id 자동 검증
```

**테스트:**
```prompt
테스트 시나리오:

1. 수정:
   - "외식비 85,000원" 선택
   - 금액을 95,000원으로 변경
   - 메모 변경
   - DB 확인

2. 삭제:
   - "경조사비 100,000원" 선택
   - 취소 클릭 (삭제 안 됨)
   - 다시 삭제 확인
   - DB 삭제 확인

3. 합계 재계산 확인

4. 동시성 테스트:
   - 두 브라우저 창
   - 한 창에서 수정
   - 다른 창에서 실시간 반영 확인
```

---

## 🏷️ Phase 4: 카테고리 관리

### Step 4.1: 카테고리 관리 페이지

```prompt
/app/(app)/settings/categories/page.tsx 생성

탭 구조:
- 수입 / 지출(고정) / 지출(변동) / 지출(비정기)

카테고리 카드:
- 아이콘, 이름, 색상
- 사용 횟수
- 편집/삭제/숨김 버튼
- 드래그 앤 드롭 (순서 변경)

"+ 새 카테고리 추가" 버튼

라이브러리: @dnd-kit

반응형 그리드
```

**테스트:**
```prompt
테스트:

1. 각 탭 확인
2. 기본 카테고리 확인:
   - 수입: 4개
   - 고정 지출: 7개
   - 변동 지출: 8개
   - 비정기 지출: 5개

3. 사용 횟수 확인:
   - "월급": 1회
   - "외식비": 1회

4. 아이콘, 색상 확인
5. 기본 카테고리 "기본" 뱃지
```

---

### Step 4.2: 카테고리 추가

```prompt
카테고리 추가 모달/페이지 생성

필드:
- 카테고리 이름 (필수)
- 타입 (수입/지출)
- 지출 구분 (고정/변동/비정기)
- 아이콘 선택
- 색상 선택

아이콘 그룹:
- 음식: 🍔 🍕 🍜 🍱 🍰 ☕
- 교통: 🚗 🚕 🚌 🚇 ✈️ 🚲
- 주거: 🏠 🏢 💡 🔌
- 건강: 💊 💉 🏥
- 교육: 📚 ✏️ 🎓
- 쇼핑: 🛍️ 👕 👗
- 여가: 🎬 🎮 🎵 ⚽
- 기타: 💰 💳 💵 📱

유효성 검증:
- 이름 중복 체크
- 2-20자 제한

저장:
- categories INSERT
- is_custom = true
- display_order 마지막
```

**테스트:**
```prompt
카테고리 추가:

1. 변동 지출:
   - "반려동물" / 🐕 / #F59E0B

2. 변동 지출:
   - "취미" / 🎸 / #8B5CF6

3. 비정기 지출:
   - "여행" / ✈️ / #3B82F6

각 추가 후:
- DB 확인
- is_custom = true 확인
- 목록에 표시 확인
- 거래 입력 폼에 나타나는지 확인

에러 케이스:
1. 중복 이름 ("외식비")
2. 빈 이름
3. 50자 이상 이름
```

---

### Step 4.3: 카테고리 수정/삭제

```prompt
카테고리 수정 및 삭제 구현

수정:
1. 편집 버튼 → 폼 (pre-fill)
2. 기본 카테고리: 이름, 아이콘, 색상만
3. 커스텀 카테고리: 모든 필드
4. UPDATE

삭제:
1. 기본 카테고리: 삭제 불가, 숨김만
2. 커스텀 카테고리: 삭제 가능
3. 거래 있으면 경고
4. 거래 있으면 "기타"로 이동

숨김/표시:
1. 기본 카테고리 숨김 토글
2. 숨긴 카테고리 별도 섹션
3. 거래 입력 시 숨긴 카테고리 미표시
```

**테스트:**
```prompt
테스트:

1. 기본 카테고리 수정:
   - "외식비" 아이콘 변경 (🍔 → 🍕)
   - 색상 변경
   - DB 확인
   - 거래 목록에 반영 확인

2. 커스텀 카테고리 수정:
   - "반려동물" → "펫케어"

3. 기본 카테고리 숨김:
   - "아기" 숨김
   - 거래 입력 폼에 미표시 확인
   - 숨긴 카테고리 섹션 표시
   - 다시 표시로 전환

4. 커스텀 카테고리 삭제 (거래 없음):
   - "취미" 삭제
   - DB 삭제 확인

5. 커스텀 카테고리 삭제 (거래 있음):
   - "반려동물"로 거래 1건 추가
   - 삭제 시도
   - 경고 메시지
   - 삭제 후 거래가 "기타"로 이동 확인

6. 기본 카테고리 삭제 시도:
   - "식비" 삭제 버튼 비활성화 또는 경고
```

---

### Step 4.4: 카테고리 순서 변경

```prompt
드래그 앤 드롭 순서 변경 구현

요구사항:
1. @dnd-kit/sortable 사용
2. 드래그하여 순서 변경
3. 드롭 시:
   - display_order 재계산
   - PUT /api/categories/reorder
   - UPDATE
4. 낙관적 업데이트
5. 시각적 피드백

제약: 같은 타입 내에서만 순서 변경
```

**테스트:**
```prompt
테스트:

1. 기본 순서 기록:
   - 변동 지출 탭 순서

2. 순서 변경:
   - "외식비"를 첫 번째로
   - DB display_order 확인

3. 여러 번 변경:
   - "교통비"를 두 번째로
   - "생필품"을 마지막으로

4. 다른 탭 확인:
   - 다른 타입 영향 없음

5. 거래 입력 시 순서 반영:
   - 드롭다운이 변경된 순서로 표시

6. 새로고침 후 순서 유지

7. 다른 사용자 동기화:
   - 두 번째 계정에서 순서 확인
```

---

## 체크포인트 1 요약

Phase 1-4 완료 후 확인:

✅ 프로젝트 설정 완료
✅ 인증 시스템 작동
✅ 가구 생성/참여 가능
✅ 거래 입력/수정/삭제 가능
✅ 월별 거래 목록 표시
✅ 카테고리 완전 관리 가능
✅ 더미 데이터 입력 완료

**다음 단계**: Part 2 (예산, 자산, 대시보드)
