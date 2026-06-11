# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.4 (클라이언트/UI 계층 전면 리팩토링)
- **빌드 상태**: 성공 (`tsc --noEmit` 통과, `eslint` 0 오류 0 경고, `next build` 성공)
- **배포 상태**: v0.6.4는 **로컬 커밋만 완료, 푸시/배포 안 함** (아래 '다음 TODO' 참고)
  - 프로덕션에는 v0.6.3이 배포되어 있음 (2026-06-11, 커밋 `2da10e3`)
  - 문제 발생 시 롤백: `vercel rollback` 또는 `git revert <커밋>` 후 푸시
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **관리자 계정**: waterdrop11@naver.com

## Supabase 환경

| 환경 | URL                                | 용도             |
| ---- | ---------------------------------- | ---------------- |
| 개발 | `tsqrohamnjtqocmnokmo.supabase.co` | 로컬 개발/테스트 |
| 운영 | `bgevpihfcvraxososcll.supabase.co` | 프로덕션         |

## 최근 작업

- **(NEW) 클라이언트/UI 계층 전면 리팩토링 (v0.6.4)**: 상세 내역은 CHANGELOG.md 2026-06-12 참고
  - lint 101개 문제(오류 62, 경고 39) → **0개** 달성
  - `any` 35건 제거 (공유 타입 `TransactionRpcRow` 신설, `Category`/`Asset` 타입 통일)
  - setState-in-effect 8건을 React 19 권장 패턴으로 교체 (key 리마운트, 액션 래퍼, 이벤트 핸들러, useSyncExternalStore)
  - `?mode=add` 딥링크의 다이얼로그 재오픈 잠재 버그 수정, 미사용 `category-chart.tsx` 삭제
- **서버 액션 전면 보안 리팩토링 (v0.6.3)**: 공개 액션 노출 취약점 격리, 입력 검증 통일, CSP 강화 (배포 완료)

## 알려진 이슈

- Next.js 16 middleware → proxy 경고 (기능 문제 없음)
- **[주의]** 마이그레이션(`20260212000000_security_rpc_fix.sql`)을 실제 Supabase DB에 적용해야 RPC 보안이 활성화됨
- **[중단 지점] 로컬 E2E 테스트 미완**: 로컬 dev 서버 + Playwright로 회원가입부터 검증하려 했으나, 이 작업 환경에서 `*.supabase.co` 서브도메인 DNS 해석이 실패해 (vercel.app/google.com은 정상, supabase.co 루트도 정상 — 프로젝트 서브도메인만 실패) 회원가입이 일반 오류를 반환하며 진행 불가. 개발 Supabase 프로젝트가 **일시중지(paused)** 상태일 가능성이 높음 → Supabase Dashboard에서 dev 프로젝트 상태 확인 필요

## 개발 도구 (MCP)

- **Playwright MCP**: 설치 완료 (로컬 스코프) — 브라우저 검증에 사용
- **Supabase MCP**: 미설치 — 개인 액세스 토큰(PAT) 필요. https://supabase.com/dashboard/account/tokens 에서 발급 후:
  `claude mcp add supabase --env SUPABASE_ACCESS_TOKEN=<토큰> -- cmd /c npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=bgevpihfcvraxososcll`
- **Vercel**: CLI 설치·인증 완료 (v50.9.6) — 배포 확인/롤백에 사용

## 다음 TODO

1. [ ] 개발 Supabase 프로젝트(tsqro...) 일시중지 여부 확인 및 재개 (Dashboard)
2. [ ] 로컬 E2E 테스트 재개: dev 서버 + Playwright로 회원가입 → 온보딩 → 카테고리 다이얼로그(`?mode=add` 딥링크) → 자산 다이얼로그 → 예산 → 거래 추가 → 피드백 제출 순으로 v0.6.4 리팩토링 컴포넌트 검증
3. [ ] 검증 통과 후 v0.6.4 푸시 → Vercel 자동 배포 → 프로덕션 확인
4. [ ] (필요시) Supabase Dashboard에서 신규 SQL 마이그레이션 실행 (`20260212000000_security_rpc_fix.sql`)
5. [ ] 관리자 페이지 기능 고도화 (통계 등)
