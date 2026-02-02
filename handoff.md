# Couple Finance - Handoff

## 현재 상태
- **버전**: v0.1.0 (초기 커밋)
- **빌드 상태**: 미확인
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master

## 최근 작업
- GitHub 저장소 생성 및 초기 커밋 푸시 완료
- PRD v2.0 대비 현재 구현 상태 분석 완료

## 알려진 이슈 (PRD 대비 누락/불일치)

### 치명적
1. `asset_history` 테이블 부재 → 자산 추이 차트 데이터 없음
2. `payment_methods` 테이블 부재 → 결제 수단 분석 불가
3. Framer Motion 미사용 → 탭/차트 전환 애니메이션 없음

### 중요
1. 자산 타입 enum 불일치 (`CASH` vs `cash`)
2. 프로필에 `role` 컬럼 없음 (가구 소유자/멤버 구분 불가)
3. 카테고리 `is_hidden` 컬럼 없음
4. `transactions.last_modified_by` 컬럼 없음

### 경미
1. 디렉토리 경로명 차이 (`(main)` vs `(app)`)
2. 상태 관리 패턴 차이 (Zustand vs Server Actions)

## 다음 TODO
1. [ ] `asset_history` 테이블 생성 + 스냅샷 로직 구현
2. [ ] `payment_methods` 테이블 추가
3. [ ] `transactions.payment_method_id` 컬럼 추가
4. [ ] Framer Motion 설치 및 애니메이션 적용
5. [ ] 자산 타입 enum 대문자로 통일
6. [ ] 프로필 `role` 컬럼 추가
