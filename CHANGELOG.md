# Changelog

## 2026-02-09

### v0.4.4 - 자산 차트 개선, 가계부 카테고리 상세, 카테고리 소프트 삭제
- **자산 포트폴리오 차트 개선**
  - Recharts Tooltip/activeShape 완전 제거 → 네모박스/검은 테두리 해결
  - SVG focus outline 강제 제거 (CSS)
  - 클릭 시 Total 아래에 한 줄로 자산 정보 표시
  - `isAnimationActive=false`로 퍼센트 즉시 표시
  - 레전드 금액 내림차순 정렬
- **자산변동기록 도움말 안내 박스 추가**
  - 파란색 Info 박스로 입력 가이드 표시
- **가계부 탭 카테고리별 상세 펼침**
  - MonthSummaryCards 클라이언트 컴포넌트 신규
  - 수입/지출 카드 클릭 시 카테고리별 목록 (비율 프로그레스바)
  - 카테고리 클릭 시 CategoryTransactionsModal 연동
- **카테고리 삭제 소프트 삭제로 통합**
  - deleteCategory: 하드 삭제 → `is_hidden=true` (기본/커스텀 모두)
  - restoreCategory 복원 함수 추가
  - 숨기기 토글 UI 제거, 삭제 버튼 모든 카테고리에 적용
  - 설정 하단에 "삭제된 카테고리" 접이식 복원 섹션
  - DeletedCategoryList 컴포넌트 신규

## 2026-02-08

### v0.4.3 - 활동기록 재수정 및 가구 멤버 표시
- **활동기록 "방금 전" 버그 수정**
  - `created_at` NULL fallback을 `new Date().toISOString()` → 빈 문자열로 변경
  - Supabase 쿼리에 `.not("created_at", "is", null)` + `.gte()` 필터 추가
  - 기존 잘못된 활동기록 DB에서 일괄 삭제 (SQL 실행)
- **활동기록 초기화 기능 추가**
  - `clearActivityLogs` 서버 액션 추가
  - 활동기록 시트 하단에 초기화 버튼 배치
  - `activity_logs` DELETE RLS 정책 추가
- **설정 페이지 가구 멤버 표시 수정**
  - profiles SELECT RLS: `auth.uid() = id` → 같은 `household_id` 멤버도 조회 허용
  - `get_my_household_id()` SECURITY DEFINER 함수로 RLS 서브쿼리 재귀 문제 해결

### v0.4.2 - 활동기록 버그 수정 및 모달 레이아웃 개선
- **활동기록 1970/1/1 날짜 버그 수정**
  - `created_at`을 명시적 `new Date().toISOString()`으로 설정 (DB DEFAULT 의존 제거)
  - `getActivityLogs`에서 명시적 컬럼 선택 + 문자열 변환 보장
  - `formatTimeAgo` null/invalid/2000년 미만 방어 처리
- **활동기록 금액 포맷 수정**
  - 모든 서버 액션에서 `Math.round(amount).toLocaleString("ko-KR")` 명시
- **활동기록 로깅 범위 확대**
  - 거래 수정(UPDATE) 시 활동기록 추가
  - 예산 설정 시 활동기록 추가
  - 카테고리 생성/수정/삭제 시 활동기록 추가
- **활동기록 UI 개선**
  - action_type 한글 표시 (추가/수정/삭제)
  - 프로필 이름 표시에서 불필요한 "님이" 접미사 제거
- **거래내역 모달 레이아웃 재구성**
  - `overflow-x-hidden` 제거, 근본적 레이아웃 수정
  - 금액을 카테고리명 우측 같은 줄에 배치 (가로 공간 절약)
  - 패딩 축소 (p-6→p-4), 아이템 컴팩트화
  - 제목에 pr-6 여백 추가 (닫기 버튼 겹침 방지)

## 2026-02-05

### v0.3.9 - UI/UX 개선
- **확인 모달 스타일 적용**
  - ConfirmProvider 컨텍스트 및 useConfirm 훅 추가
  - 브라우저 기본 confirm() 대신 스타일된 모달 사용
  - 거래/카테고리/자산 삭제, 로그아웃에 적용
  - danger(빨강)/warning(주황)/default 변형 지원
- **결제수단 기능 완전 삭제**
  - 미사용 기능으로 판단하여 제거
  - payment-methods 관련 파일 및 메뉴 삭제
- **활동기록 쿼리 수정**
  - join 쿼리 → 별도 쿼리로 변경
  - 최신순 정렬 적용
- **금액 표시 개선**
  - 대시보드/자산 페이지에서 만/억 단위 표시
  - 오버플로우 방지
- **카테고리 색상**
  - 사용자 설정 색상이 UI 전체에 동적 적용
  - 기본 카테고리 색상을 색상 선택기에 추가

## 2026-02-04

### v0.3.8 - 예산 실적 분석 페이지
- **신규 페이지: 항목별 예산 실적 분석**
  - 경로: `/transactions/[yearMonth]/analysis`
  - 가계부 탭 우측 상단 버튼으로 진입
  - 수입/고정지출/변동지출/비정기지출 테이블 형식 표시
  - 항목별 수평 막대 그래프 (Recharts)
  - 지출 유형별 비율 프로그레스 바
  - 잔액 계산 및 표시
- **카테고리 추가 버그 수정**
  - createCategory에서 `is_hidden: false` 명시적 설정
  - 카테고리 CRUD 시 `/transactions/new` revalidatePath 추가

## 2026-02-03

### v0.3.7 - 가구 생성 버그 수정 및 성능 개선
- **회원가입 후 가구 생성 문제 해결**
  - households, profiles 테이블 INSERT RLS 정책 추가
  - SECURITY DEFINER 함수로 RLS 우회 (create_household_with_owner, join_household_as_member)
  - RPC 함수 없을 때 폴백 로직 추가
  - 운영 DB uuid-ossp 확장 및 테이블 기본값 설정
- **페이지 로딩 속도 개선**
  - 대시보드: 5개 쿼리 → Promise.all 병렬 실행
  - 자산 페이지: 4개 쿼리 병렬화
  - 거래내역 페이지: 2개 쿼리 병렬화

### v0.3.6 - UX 개선 및 PWA
- 페이지 전환 애니메이션 추가 (Framer Motion)
- PWA 설치 버튼 실제 동작하도록 구현
- iOS/Android 설치 안내 분기 처리

### v0.3.5 - 금액 입력 UX 개선
- 천단위 콤마 자동 포맷팅 (1,000원 단위)
- 키보드 올라올 때 입력 필드 자동 스크롤
- AmountInput 공통 컴포넌트 추가
- 거래 추가, 자산 추가, 예산 설정에 적용

### v0.3.4 - 에러 메시지 한글화
- error-messages.ts 유틸리티 추가
- Supabase 인증/DB 에러 한글 변환
- 모든 액션 파일에서 한글 에러 메시지 사용

### v0.3.3 - Vercel 배포
- Vercel 프로덕션 배포 완료
- 환경변수 설정 (운영 Supabase)
- 미들웨어 에러 핸들링 개선

### 이전 작업 (v0.3.2 이하)
- PRD v2.0 정합성 (asset_history, payment_methods, role 등)
- Framer Motion 애니메이션
- 카테고리 모달 UI 개선
- 드롭다운 메뉴 투명도 수정
- 모바일 하단 네비게이션 safe-area 적용
- 운영 DB 스키마 적용
