# Couple Finance - Handoff

## 현재 상태
- **버전**: v0.3.0
- **빌드 상태**: 성공 ✅
- **DB 마이그레이션**: 적용 완료 ✅
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master
- **최신 커밋**: bb89b1c

## 최근 작업
- 결제 수단 UI 구현 (`/settings/payment-methods`)
- 자산 추이 차트에 asset_history 데이터 연동
- themeColor → viewport export 이동 (Next.js 16 권장사항)
- next.config.ts eslint 설정 제거

## 완료된 PRD 정합성 항목
- [x] `asset_history` 테이블 + 스냅샷 로직
- [x] `payment_methods` 테이블 + UI
- [x] `profiles.role` 컬럼 (OWNER/MEMBER)
- [x] `transactions` 확장 (payment_method_id, last_modified_by)
- [x] 자산 타입 대문자 표준화
- [x] Framer Motion 애니메이션
- [x] themeColor viewport 분리

## 알려진 이슈

### 미해결 (경미)
1. middleware → proxy 전환 권장 (Next.js 16 deprecation)
   - Supabase Auth 미들웨어 마이그레이션 필요
   - 복잡도 높음, 별도 작업 권장

## 다음 TODO
1. [ ] 거래 입력 시 결제 수단 선택 UI 추가
2. [ ] middleware → proxy 전환 (선택)
3. [ ] 거래 목록에서 결제 수단 표시
