# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.4 (클라이언트/UI 계층 전면 리팩토링)
- **빌드 상태**: 성공 (`tsc --noEmit` 통과, `eslint` 0 오류 0 경고, `next build` 성공)
- **배포 상태**: v0.6.4 배포 완료 (2026-06-13, 커밋 `f50f71f`)
  - Vercel 자동 빌드 및 배포가 완료되었으며 프로덕션에서 정상 동작을 검증했습니다.
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **관리자 계정**: waterdrop11@naver.com

## Supabase 환경

- 개발/운영 환경 구분 없이 단일 운영 프로젝트(`ieahmpxiaamesrnfgbng.supabase.co`)를 공용 사용합니다.
- `.env.local`이 해당 실서버 정보를 가리키도록 갱신하여 로컬 개발 환경에서도 정상 작동하도록 수정했습니다.

## 최근 작업

- **(완료) v0.6.4 클라이언트/UI 계층 전면 리팩토링 검증 및 배포**:
  - `tsc --noEmit` / `eslint` 0개 오류 확인
  - 로컬 및 프로덕션 환경에서 Playwright/Browser Subagent를 활용한 E2E 검증 완료 (회원가입 -> 온보딩 -> 로그인 -> 대시보드 진입 -> 카테고리 다이얼로그 정상 렌더링 검증 완료)
  - `git push`를 통해 Vercel 배포 완료

## 알려진 이슈

- Next.js 16 middleware → proxy 경고 (기능상 영향 없음)

## 개발 도구 (MCP)

- **Playwright MCP**: user 스코프 설치됨 — 브라우저 검증에 사용
- **Vercel**: CLI 설치·인증 완료 (v50.9.6) — 배포 확인/롤백에 사용

## 다음 TODO

1. [ ] 관리자 페이지 기능 고도화 (통계 등)
2. [ ] (필요시) Supabase Dashboard에서 신규 SQL 마이그레이션 실행 (`20260212000000_security_rpc_fix.sql`)
