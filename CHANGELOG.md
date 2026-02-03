# Changelog

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
