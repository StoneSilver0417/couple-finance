# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.3 (서버 액션 전면 보안 리팩토링)
- **빌드 상태**: 성공 (`npm run build` / `tsc --noEmit` 모두 통과)
- **배포 상태**: 로컬 작업 완료, **커밋/푸시 대기 중** → Vercel 재배포 필요
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **관리자 계정**: waterdrop11@naver.com

## Supabase 환경

| 환경 | URL                                | 용도             |
| ---- | ---------------------------------- | ---------------- |
| 개발 | `tsqrohamnjtqocmnokmo.supabase.co` | 로컬 개발/테스트 |
| 운영 | `bgevpihfcvraxososcll.supabase.co` | 프로덕션         |

## 최근 작업

- **(NEW) 서버 액션 전면 보안 리팩토링 (v0.6.3)**: 상세 내역은 CHANGELOG.md 2026-06-11 참고
  - 신규 공통 모듈 3개: `lib/supabase/household-context.ts`(인증+가구 조회 단일 진입점), `lib/validation.ts`(입력 검증 유틸), `lib/activity-log.ts`(로그 기록 내부화)
  - `syncMonthlyBalance`·`createActivityLog` 공개 액션 노출 취약점 격리
  - 전체 액션 파일에서 무검증 `as string` 캐스팅 제거, 화이트리스트/길이/금액 검증 적용
  - 프로덕션 CSP에서 `'unsafe-eval'` 제거, `ignoreBuildErrors` 제거
- **거래 내역 복사 기능 (v0.6.2)**: 거래 목록 드롭다운에서 '복사' → 새 거래 폼 자동 채움 (커밋/푸시 완료)

## 알려진 이슈

- Next.js 16 middleware → proxy 경고 (기능 문제 없음)
- **[주의]** 마이그레이션(`20260212000000_security_rpc_fix.sql`)을 실제 Supabase DB에 적용해야 RPC 보안이 활성화됨
- `npm run lint`에 기존 UI 코드의 오류 다수 잔존 (react-hooks/set-state-in-effect, no-explicit-any 등 — 이번 리팩토링과 무관, 빌드에는 영향 없음)

## 다음 TODO

1. [ ] v0.6.3 변경분 GitHub Commit & Push (13개 수정 + 3개 신규 파일)
2. [ ] Vercel 프로덕션 배포 후 CSP 변경(`unsafe-eval` 제거)로 인한 화면 깨짐 여부 확인
3. [ ] (필요시) Supabase Dashboard에서 신규 SQL 마이그레이션 실행
4. [ ] 기존 lint 오류 정리 (UI 컴포넌트 setState-in-effect, any 타입 등)
5. [ ] 관리자 페이지 기능 고도화 (통계 등)
