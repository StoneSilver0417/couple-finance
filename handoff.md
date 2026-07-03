# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.4 + 자산 페이지 버그 수정 다수
- **빌드 상태**: 성공 (`tsc --noEmit` 통과, `eslint` 0 오류 0 경고, `next build` 성공)
- **배포 상태**: 배포 완료 (2026-07-03, 커밋 `1456cb8`) — 프로덕션에 Playwright로 직접 검증 완료
- **참고**: 로컬 DNS 문제는 해소됨 — 과거 handoff에 남아있던 옛(존재하지 않는) Supabase 주소가 원인이었고, 실제 운영 프로젝트(`ieahmpxiaamesrnfgbng`)는 로컬에서도 정상 연결됨
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **관리자 계정**: waterdrop11@naver.com

## Supabase 환경

- 개발/운영 분리 없이 **단일 운영 프로젝트**만 존재
  - 운영: `ieahmpxiaamesrnfgbng.supabase.co`
  - `.env.local`도 동일 주소로 설정되어 있음
- 과거 handoff에 기록된 `tsqro...`, `bgevp...` 주소는 실존하지 않는 잘못된 기록이었음 (수정 완료)

## 최근 작업

- **(완료) 자산 수정 시 즉시 갱신 안 되던 문제 수정 (2026-07-03, 커밋 `1456cb8`)**: 상세 내역은 CHANGELOG.md 참고
  - 원인: `assets-page-client.tsx`의 `filteredAssets`를 `useState(assets)`로 props 복사 보관 → 마운트 시점에 고정돼, 자산 수정 후 `router.refresh()`로 새 props가 내려와도 총 순자산/포트폴리오/목록이 갱신 안 됨
  - 수정: `filteredAssets`를 `(assets, activeFilterId)`에서 매 렌더 파생시키는 `useMemo`로 교체. 자산 수정/삭제 액션에도 `router.refresh()` 추가
  - 검증: 프로덕션에서 자산 금액을 반복 수정하며 새로고침 없이 즉시 반영됨을 확인 (100만→350만→900만→1235만→2000만 순으로 실시간 확인)
- **(완료) 자산 변동 기록 차트 개선 3건 (2026-07-03, 커밋 `cd1a3d2`/`8c64fff`/`921de16`)**: dot 제거, X/Y축 라벨 개수 제한, Y축 nice-number 적용, 클릭 시 테두리 제거, 최소 변동폭(자산 규모 15%) 강제로 사소한 변동이 급락처럼 보이던 문제 수정. 상세는 CHANGELOG.md
- **(완료) 거래 삭제 확인창 클릭 버그 수정 (2026-07-03, 커밋 `b177c5a`)**: Radix DropdownMenu의 `body.pointerEvents:none` 잠금을 커스텀 확인창이 상속받아 첫 클릭이 씹히던 문제. 상세는 CHANGELOG.md
- **(완료) v0.6.4 배포 및 E2E 검증 (2026-06-13)**: 클라이언트/UI 계층 리팩토링, lint 101개 → 0개

## 알려진 이슈

- Next.js 16 middleware → proxy 경고 (기능상 영향 없음)
- **[중요][미해결] 자산 변동 기록 스냅샷이 하루 중 최초 1회만 기록되고 이후 수정은 반영 안 됨**
  - 증상: 같은 날 자산 금액을 여러 번 수정하면 총 순자산/포트폴리오/목록은 정상 갱신되지만, "자산 변동 기록" 차트의 `asset_history` 스냅샷(`total_net_worth`)은 그날 최초 값에 고정되고 이후 수정이 반영 안 됨
  - `lib/asset-actions.ts`의 `saveAssetSnapshot()`이 `asset_history`에 `upsert(..., {onConflict: "household_id,record_date"})` 호출 — 테이블의 실제 UNIQUE 제약(`UNIQUE(household_id, record_date)`, `20260202000000_prd_alignment.sql`)과 일치하는데도 실패
  - Vercel 런타임 로그로 확인한 결과 `saveAssetSnapshot`의 try/catch에서 에러가 전혀 찍히지 않음 (즉, upsert 호출 자체는 에러 없이 "성공"하는데 값이 실제로 갱신되지 않는 것으로 보임) — RLS 정책의 UPDATE 경로 문제 등이 의심되나, DB 직접 조회 없이는 확정 불가
  - **다음 세션 조사 방법**: Supabase MCP 설치(PAT 발급 필요, 아래 명령 참고) 후 `asset_history` 테이블을 직접 조회해 실제 로우 값 확인, RLS 정책 재검토
- **[주의] 테스트 데이터 정리 필요**: E2E 테스트 과정에서 실제 운영 DB에 테스트 데이터가 생성됨 (아래 2개 계정 모두 정리 필요)
  - 계정 1: `test_e2e_antigravity_1@example.com` / 가구명: "Test Household"
  - 계정 2: `cf-fixverify-1783040957@gmail.com` / 가구명: "버그검증 가계부" (자산 1건 "테스트 적금", 여러 차례 금액 수정 테스트로 현재 2000만원. 가구 삭제 시 CASCADE로 함께 정리됨)
  - 정리 방법 (Supabase SQL Editor):
    ```sql
    -- 1. 가구 삭제 (categories 등 CASCADE 자동 삭제)
    DELETE FROM households
    WHERE id IN (
      SELECT household_id FROM profiles
      WHERE email IN ('test_e2e_antigravity_1@example.com', 'cf-fixverify-1783040957@gmail.com')
    );
    -- 2. Dashboard > Authentication > Users 에서 두 계정 직접 삭제
    ```

## 개발 도구 (MCP)

- **Playwright MCP**: user 스코프 설치됨 — 브라우저 검증에 사용
- **Vercel**: CLI 설치·인증 완료 (v50.9.6) — 배포 확인/롤백에 사용, `vercel logs <url> --format=json`으로 런타임 로그 실시간 확인 가능(최대 5분)
- **Supabase MCP**: 미설치 — 위 asset_history 버그 조사에 필요. 설치 명령:
  `claude mcp add supabase --env SUPABASE_ACCESS_TOKEN=<토큰> -- cmd /c npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=ieahmpxiaamesrnfgbng`

## 다음 TODO

1. [ ] **[우선] 자산 변동 기록 스냅샷 미갱신 버그 조사·수정** (Supabase MCP로 `asset_history` 직접 조회 → RLS/upsert 원인 확정 → 수정)
2. [ ] **운영 DB 테스트 데이터 정리** (위 SQL 실행 후 Auth 계정 삭제)
3. [ ] 관리자 페이지 기능 고도화 (통계 등)
4. [ ] (필요시) Supabase Dashboard에서 SQL 마이그레이션 실행 (`20260212000000_security_rpc_fix.sql`)
