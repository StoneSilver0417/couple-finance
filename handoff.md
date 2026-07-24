# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.6 + 서버 왕복/초기 번들 성능 최적화 Phase A·B 배포 완료
- **검증 상태**: `npx tsc --noEmit`, `npx eslint .`, `npm run build`(네트워크 제한 없는 로컬 환경, Turbopack) 모두 통과. Playwright로 대시보드·설정·자산·연간 요약·분석·월간 보고서 6개 페이지 콘솔 에러 0건 확인, 자산 등록/삭제로 당일 스냅샷 생성과 새 CSS 확인 다이얼로그(첫 클릭 정상) 라이브 검증
- **번들 보조 지표**: Next 16은 공식 First Load JS를 출력하지 않아 동일 manifest 산식으로 비교(Codex 측정). gzip 초기 JS는 대시보드 -47.0%, 자산 -34.1%, 분석 -46.9%, 연간 -50.8%, 설정 -12.8%
- **배포 상태**: 커밋 완료 후 푸시·Vercel 프로덕션 배포 진행(DB 마이그레이션 없는 순수 코드 변경이라 즉시 배포)
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **Supabase**: 단일 운영 프로젝트 사용. 신규 DB/RPC/마이그레이션 변경 없음

## 최근 작업

- **앱 속도 개선 Phase A·B 배포 (2026-07-24, Codex 구현 + Claude Code 검토/수정/배포)**: 사용자가 "폰 PWA에서 전반적으로 느려졌다"고 지적, 조사 후 계획 승인받아 Codex에 위임. React `cache()` 기반 `getCachedUser()`/`getCachedProfile()`로 요청당 auth/profile 중복 조회 제거, settings 페이지 직렬 8~10회 왕복을 3단계로 축소, assets 당일 스냅샷 INSERT를 `after()`로 렌더 후 실행, 전역 framer-motion(template/confirm-dialog) 제거 후 CSS 애니메이션 대체, recharts 4곳 `next/dynamic` 지연 로드, 미사용 의존성(`emoji-picker-react`/`next-pwa`)·파일(`page-transition.tsx`, 로고 2.8MB) 정리. middleware `getClaims()` 전환은 근거 부족으로 보류(`getUser()` 유지, 보안 우선). Codex가 샌드박스 git 권한 문제로 커밋을 못 남겨 코드가 미커밋 상태로 남아 있었음 — 검토 중 `@types/next-pwa` 잔존 devDependency를 추가로 정리하고, 실제 네트워크 가능한 로컬에서 tsc/eslint/build 전부 통과 확인, Playwright로 6개 페이지+자산 등록/삭제+확인 다이얼로그 라이브 검증 후 커밋·배포. 상세 수치는 CHANGELOG.md 참고.

## 알려진 이슈

- **실제 폰 PWA 체감 재확인 필요**: 로컬 dev 서버 Playwright 검증은 마쳤으나, 실제 폰에서 첫 실행·페이지 이동·저장 체감 개선은 사용자 확인 대기.
- **A4(middleware getClaims) 보류**: 운영 사용자 JWT가 비대칭 키인지 확인되지 않아 `getUser()`를 그대로 유지 중. 근거 확보 전까지 착수하지 않음.
- **AI 보고서 실사용 생성 E2E 미완료**: 정상 Gemini 키 등록 계정이 없어 월간·분기·반기·연간 실제 생성→저장 경로는 미검증 상태다.
- **자산 변동 기록 스냅샷 미갱신**: 같은 날 여러 번 자산을 수정하면 `asset_history.total_net_worth`가 최초 값에 고정된다. RLS UPDATE 경로 확인이 필요하다.
- **운영 DB 테스트 데이터 정리 필요**: 테스트 계정과 연간 요약 E2E 계정은 정리 대상이다. README 데모 가구는 재촬영용 유지 권장.

## 다음 TODO

1. [ ] 실제 폰 PWA에서 첫 실행·페이지 이동·저장 체감이 실제로 개선됐는지 사용자가 확인한다.
2. [ ] 로그인 세션으로 middleware `getClaims()` warm 요청을 계측해 `/auth/v1/user`가 사라질 때만 A4를 적용한다.
3. [ ] 정상 Gemini API 키 계정으로 기간 보고서 생성 E2E를 수행하고 자산 변동 기록 미갱신 버그를 조사한다.
4. [ ] 운영 DB 테스트 계정 3개를 정리한다.
