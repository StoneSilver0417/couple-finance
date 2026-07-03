# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.4 + 거래 삭제 버튼 버그 수정 + 자산 변동 기록 차트 개선
- **빌드 상태**: 성공 (`tsc --noEmit` 통과, `eslint` 0 오류 0 경고, `next build` 성공)
- **배포 상태**: 배포 완료 (2026-07-03, 커밋 `8c64fff`) — 프로덕션에 Playwright로 직접 검증 완료
- **참고**: 로컬 DNS 문제는 해소됨 — 과거 handoff에 남아있던 옛(존재하지 않는) Supabase 주소가 원인이었고, 실제 운영 프로젝트(`ieahmpxiaamesrnfgbng`)는 로컬에서도 정상 연결됨
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **관리자 계정**: waterdrop11@naver.com

## Supabase 환경

- 개발/운영 분리 없이 **단일 운영 프로젝트**만 존재
  - 운영: `ieahmpxiaamesrnfgbng.supabase.co`
  - `.env.local`도 동일 주소로 설정되어 있음
- 과거 handoff에 기록된 `tsqro...`, `bgevp...` 주소는 실존하지 않는 잘못된 기록이었음 (수정 완료)

## 최근 작업

- **(완료) 자산 차트 Y축 nice-number + 클릭 테두리 제거 (2026-07-03, 커밋 `8c64fff`)**: 상세 내역은 CHANGELOG.md 참고
  - 증상: Y축 눈금이 "4663만/-293만"처럼 어중간하게 표시, 차트 클릭 시 검은 포커스 테두리 발생
  - 수정: Heckbert nice-number 알고리즘으로 Y축 domain/ticks를 딱 떨어지는 값으로 재계산 (평평한 선 예외 처리 포함), 포트폴리오 파이차트에 썼던 outline:none/tap-highlight 패턴을 트렌드 차트에도 적용
  - 검증: node로 nice-tick 계산 다양한 케이스(평평한 값/0/음수/큰값) 재확인, 프로덕션 배포 후 단일 데이터 케이스·탭 전환 무오류 확인. **다중 포인트 렌더링 육안 확인은 여전히 못함** (아래 자산 변동 기록 차트 개선 항목과 동일한 이유)
- **(완료) 자산 변동 기록 차트 개선 (2026-07-03, 커밋 `cd1a3d2`)**: 상세 내역은 CHANGELOG.md 참고
  - 증상: 점(dot)과 X축 날짜 라벨이 데이터가 쌓일수록 겹쳐 보임
  - 수정: dot 제거(hover 강조점만 유지), X축 라벨 최대 6개로 제한하는 interval 계산식 적용, Y축 눈금 4개 제한, 1/3/6개월·전체 기간 탭 추가(기본 3개월)
  - 검증: 프로덕션에서 탭 전환·단일 데이터 케이스 무오류 확인. **다수 데이터 포인트 시각 확인은 못함** — 앱이 하루 1 스냅샷만 허용해 테스트 계정에서 다일(多日) 이력을 재현할 수 없었음. 실사용 계정(과거 이력 있는)에서 육안 확인 권장
- **(완료) 거래 삭제 확인창 클릭 버그 수정 및 배포 (2026-07-03)**: 상세 내역은 CHANGELOG.md 참고
  - 원인: Radix DropdownMenu가 닫히는 동안 걸어두는 `body.pointerEvents:none` 잠금을 커스텀 확인창(`confirm-dialog.tsx`)이 상속받아 첫 클릭이 씹히던 문제
  - 수정: 확인창 오버레이에 `pointerEvents: "auto"` 명시 → 커밋 `b177c5a` → 푸시 → Vercel 프로덕션 배포 완료
  - Playwright로 프로덕션에서 직접 재현·검증: 삭제 클릭 시점 `body.pointerEvents === "none"` 확인 → 수정 후 확인창 computed pointer-events는 `"auto"`로 무시됨 → 단일 클릭 삭제 성공 확인
- **(완료) v0.6.4 배포 및 E2E 검증 (2026-06-13)**:
  - 회원가입 → 가구 생성(온보딩) → 로그인 → 대시보드 → 카테고리 다이얼로그 전 과정 검증 완료
  - `git push` → Vercel 자동 배포 완료 확인

## 알려진 이슈

- Next.js 16 middleware → proxy 경고 (기능상 영향 없음)
- **[주의] 테스트 데이터 정리 필요**: E2E 테스트 과정에서 실제 운영 DB에 테스트 데이터가 생성됨 (아래 2개 계정 모두 정리 필요)
  - 계정 1: `test_e2e_antigravity_1@example.com` / 가구명: "Test Household"
  - 계정 2: `cf-fixverify-1783040957@gmail.com` / 가구명: "버그검증 가계부" (자산 1건 "테스트 적금" 100만원 존재, 가구 삭제 시 CASCADE로 함께 정리됨)
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
- **Vercel**: CLI 설치·인증 완료 (v50.9.6) — 배포 확인/롤백에 사용

## 다음 TODO

1. [ ] **운영 DB 테스트 데이터 정리** (위 SQL 실행 후 Auth 계정 삭제)
2. [ ] 관리자 페이지 기능 고도화 (통계 등)
3. [ ] (필요시) Supabase Dashboard에서 SQL 마이그레이션 실행 (`20260212000000_security_rpc_fix.sql`)
