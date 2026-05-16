# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.2 (Transaction Copy Feature)
- **빌드 상태**: 성공
- **배포 상태**: 로컬 수정 완료, Vercel 재배포 필요
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **관리자 계정**: waterdrop11@naver.com

## Supabase 환경

| 환경 | URL                                | 용도             |
| ---- | ---------------------------------- | ---------------- |
| 개발 | `tsqrohamnjtqocmnokmo.supabase.co` | 로컬 개발/테스트 |
| 운영 | `bgevpihfcvraxososcll.supabase.co` | 프로덕션         |

## 주요 보안 패치 (2026-02-12)

- **SQL RPC 보안**: `create_household_with_owner` 등에서 `auth.uid()` 직접 참조 (인자 조작 방지)
- **암호학적 난수**: `crypto` 모듈을 활용한 안전한 초대 코드 생성
- **IDOR 방어**: 모든 수정/삭제 서버 액션에 가구 소유권(household_id) 재검증 추가

## 최근 작업

- **(NEW) 거래 내역 복사 기능 추가 (v0.6.2)**:
  - 기존 등록된 수입/지출 거래를 간편하게 복사하여 새로 추가할 수 있도록 구현.
  - 거래 목록(메인, 일별 모달)의 드롭다운 메뉴에 '복사' 추가.
  - 선택 시 `transaction-form`으로 이동하며 금액, 카테고리, 메모 등의 기존 정보를 자동으로 채워줌.
- **거래 삭제 버그 수정 (v0.6.1)**: `components/ui/confirm-dialog.tsx`의 `resolveRef`를 `useState` → `useRef`로 교체하여 React 함수형 업데이트 오류 해결.
- **포커스 충돌 해결 (v0.6.1)**: 삭제 모달을 커스텀 `motion.div`에서 Radix UI의 `DialogPortal` 기반으로 변경.

## 알려진 이슈

- Next.js 16 middleware → proxy 경고 (기능 문제 없음)
- **[주의]** 신규 마이그레이션(`20260212000000_security_rpc_fix.sql`)을 실제 Supabase DB에 적용해야 RPC 보안이 활성화됨

## 다음 TODO

1. [ ] v0.6.2 GitHub Commit & Push
2. [ ] Vercel 프로덕션 환경에 v0.6.2 배포
3. [ ] (필요시) Supabase Dashboard에서 신규 SQL 마이그레이션 실행
4. [ ] 관리자 페이지 기능 고도화 (통계 등)
