# Couple Finance - Handoff

## 현재 상태
- **버전**: v0.2.0
- **빌드 상태**: 성공 (경고 있음 - themeColor viewport 이동 권장)
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master
- **최신 커밋**: 37becb0 - PRD v2.0 정합성 개선

## 최근 작업
- PRD v2.0 대비 스키마 정합성 개선 완료
  - `asset_history` 테이블 추가
  - `payment_methods` 테이블 추가
  - `profiles.role` 컬럼 추가
  - 자산 타입 대문자 표준화
- Framer Motion 설치 및 자산 탭 전환 애니메이션 적용

## 알려진 이슈

### 해결됨 ✅
- ~~`asset_history` 테이블 부재~~ → 추가됨
- ~~`payment_methods` 테이블 부재~~ → 추가됨
- ~~Framer Motion 미사용~~ → 설치 및 적용됨
- ~~자산 타입 소문자~~ → 대문자로 표준화
- ~~`profiles.role` 없음~~ → 추가됨

### 미해결 (경미)
1. themeColor를 viewport export로 이동 필요 (Next.js 16 권장사항)
2. middleware → proxy 전환 권장 (Next.js 16 deprecation)
3. next.config.ts의 eslint 설정 제거 필요

### DB 마이그레이션 필요
- `20260202000000_prd_alignment.sql` 파일을 Supabase에 적용해야 함
- 기존 데이터가 있는 경우 자산 타입 마이그레이션 자동 실행됨

## 다음 TODO
1. [ ] Supabase에 마이그레이션 적용
2. [ ] themeColor → viewport export 이동
3. [ ] middleware → proxy 전환
4. [ ] 결제 수단 UI 구현 (설정 페이지)
5. [ ] 자산 추이 차트에 asset_history 데이터 연동
