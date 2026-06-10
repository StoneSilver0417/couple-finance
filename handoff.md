# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.3 (서버 액션 전면 보안 리팩토링)
- **빌드 상태**: 성공 (`npm run build` / `tsc --noEmit` 모두 통과)
- **배포 상태**: 프로덕션 배포 완료 (2026-06-11, 커밋 `2da10e3`, Vercel `dpl_BQUtd5VGANZEBz7F2DwDX1SaPtdC`)
  - 보안 헤더 검증 완료: CSP에서 `unsafe-eval` 제거 확인, `Referrer-Policy` 적용 확인
  - 문제 발생 시 롤백: `vercel rollback` (직전 배포로 즉시 전환) 또는 `git revert 2da10e3` 후 푸시
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

## 개발 도구 (MCP)

- **Playwright MCP**: 설치 완료 (로컬 스코프) — 배포된 앱의 브라우저 검증(CSP 깨짐, 콘솔 오류)에 사용. 다음 세션부터 도구 사용 가능
- **Supabase MCP**: 미설치 — 개인 액세스 토큰(PAT) 필요. https://supabase.com/dashboard/account/tokens 에서 발급 후 아래 명령으로 설치:
  `claude mcp add supabase --env SUPABASE_ACCESS_TOKEN=<토큰> -- cmd /c npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=bgevpihfcvraxososcll`
- **Vercel**: CLI 설치·인증 완료 (v50.9.6) — 배포 확인/롤백에 사용, MCP 불필요

## 다음 TODO

1. [x] 프로덕션 브라우저 검증 완료 (2026-06-11, Playwright MCP) — 콘솔 오류 0건, CSP 정상, 로그인 액션·오류 토스트·비로그인 리다이렉트 정상. 단, 로그인 후 대시보드 영역은 자격증명이 없어 미검증
2. [ ] (필요시) Supabase Dashboard에서 신규 SQL 마이그레이션 실행 (`20260212000000_security_rpc_fix.sql`)
3. [ ] 기존 lint 오류 정리 (UI 컴포넌트 setState-in-effect, any 타입 등)
4. [ ] 관리자 페이지 기능 고도화 (통계 등)
