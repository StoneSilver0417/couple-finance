# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.4 (클라이언트/UI 계층 전면 리팩토링)
- **빌드 상태**: 성공 (`tsc --noEmit` 통과, `eslint` 0 오류 0 경고, `next build` 성공)
- **배포 상태**: v0.6.4 배포 완료 (2026-06-13, 커밋 `f50f71f`)
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **관리자 계정**: waterdrop11@naver.com

## Supabase 환경

- 개발/운영 분리 없이 **단일 운영 프로젝트**만 존재
  - 운영: `ieahmpxiaamesrnfgbng.supabase.co`
  - `.env.local`도 동일 주소로 설정되어 있음
- 과거 handoff에 기록된 `tsqro...`, `bgevp...` 주소는 실존하지 않는 잘못된 기록이었음 (수정 완료)

## 최근 작업

- **(완료) v0.6.4 배포 및 E2E 검증 (2026-06-13)**:
  - 회원가입 → 가구 생성(온보딩) → 로그인 → 대시보드 → 카테고리 다이얼로그 전 과정 검증 완료
  - `git push` → Vercel 자동 배포 완료 확인

## 알려진 이슈

- Next.js 16 middleware → proxy 경고 (기능상 영향 없음)
- **[주의] 테스트 데이터 정리 필요**: E2E 테스트 과정에서 실제 운영 DB에 테스트 데이터가 생성됨
  - 계정: `test_e2e_antigravity_1@example.com`
  - 가구명: "Test Household"
  - 정리 방법 (Supabase SQL Editor):
    ```sql
    -- 1. 가구 삭제 (categories 등 CASCADE 자동 삭제)
    DELETE FROM households
    WHERE id IN (
      SELECT household_id FROM profiles
      WHERE email = 'test_e2e_antigravity_1@example.com'
    );
    -- 2. Dashboard > Authentication > Users 에서 해당 계정 직접 삭제
    ```

## 개발 도구 (MCP)

- **Playwright MCP**: user 스코프 설치됨 — 브라우저 검증에 사용
- **Vercel**: CLI 설치·인증 완료 (v50.9.6) — 배포 확인/롤백에 사용

## 다음 TODO

1. [ ] **운영 DB 테스트 데이터 정리** (위 SQL 실행 후 Auth 계정 삭제)
2. [ ] 관리자 페이지 기능 고도화 (통계 등)
3. [ ] (필요시) Supabase Dashboard에서 SQL 마이그레이션 실행 (`20260212000000_security_rpc_fix.sql`)
