# Couple Finance - Handoff

## 현재 상태
- **버전**: v0.3.1
- **빌드 상태**: 성공 ✅
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master
- **최신 커밋**: 823567b

## 최근 작업
- 카테고리 모달 크기 축소 (모바일 대응)
- 카테고리 수정 시 기존 데이터 표시 버그 수정
- 드롭다운 메뉴 투명도 문제 수정
- 자산 페이지 스냅샷 자동 생성 로직

## 완료된 PRD 정합성 항목
- [x] `asset_history` 테이블 + 스냅샷 로직
- [x] `payment_methods` 테이블 + UI
- [x] `profiles.role` 컬럼 (OWNER/MEMBER)
- [x] `transactions` 확장 (payment_method_id, last_modified_by)
- [x] 자산 타입 대문자 표준화
- [x] Framer Motion 애니메이션
- [x] themeColor viewport 분리

## 알려진 이슈
- middleware → proxy 전환 권장 (Next.js 16 deprecation, 낮은 우선순위)

## 다음 TODO
1. [ ] 거래 입력 시 결제 수단 선택 UI 추가
2. [ ] 거래 목록에서 결제 수단 표시
3. [ ] 자산 추이 차트 테스트 (데이터 축적 필요)
