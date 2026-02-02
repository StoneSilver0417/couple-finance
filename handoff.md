# Couple Finance - Handoff

## 현재 상태
- **버전**: v0.2.0
- **빌드 상태**: 성공
- **DB 마이그레이션**: 적용 완료 ✅
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master
- **최신 커밋**: 9bcccdd

## 최근 작업
- PRD v2.0 대비 스키마 정합성 개선 완료
- Supabase 마이그레이션 적용 완료 (2026-02-02)
  - `asset_history` 테이블
  - `payment_methods` 테이블
  - `profiles.role` 컬럼
  - `transactions` 확장 (payment_method_id, last_modified_by)
  - 자산 타입 대문자 표준화

## 알려진 이슈

### 미해결 (경미)
1. themeColor를 viewport export로 이동 필요 (Next.js 16 권장사항)
2. middleware → proxy 전환 권장 (Next.js 16 deprecation)
3. next.config.ts의 eslint 설정 제거 필요

## 다음 TODO
1. [ ] 결제 수단 UI 구현 (설정 페이지)
2. [ ] 자산 추이 차트에 asset_history 데이터 연동
3. [ ] themeColor → viewport export 이동
4. [ ] middleware → proxy 전환
