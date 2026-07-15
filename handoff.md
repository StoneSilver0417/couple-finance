# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.4 + AI 보고서 진입점 이전 및 관리자 사용자 현황 구현 완료
- **빌드 상태**: 성공 (`npx tsc --noEmit`, `npx eslint .` 0 오류·0 경고, `npm run build` 통과)
- **배포 상태**: 기능 커밋 `d8382d0`, `3a3b073` 푸시 및 프로덕션 배포 완료. Vercel `dpl_45u363NbrrDGNLzsRVoaVDZoieys` `Ready`, 운영 별칭 연결 확인
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **Supabase**: 개발/운영 분리 없이 `ieahmpxiaamesrnfgbng.supabase.co` 단일 프로젝트 사용

## 최근 작업

- **AI 보고서 진입점 이전 (2026-07-15, `d8382d0`)**: 분석 페이지 헤더에 해당 월의 `/reports/[yearMonth]`로 이동하는 `AI 보고서` 버튼을 추가했다. 미래월에서는 서울 기준 현재월로 링크를 클램프한다. 설정 메뉴의 `AI 월간 보고서` 항목은 제거하되 AI 키 관리 다이얼로그의 이번 달 보고서 링크는 유지했다.
- **관리자 사용자 현황 구현 (2026-07-15)**: `/admin/users`에 총 사용자·총 가구·이번 달 신규 집계와 가입일·마지막 로그인·마지막 활동을 표시하는 모바일 카드 목록을 추가했다. `/admin/feedbacks`와 공통 관리자 탭을 사용하며, 비관리자는 `/settings`로 이동한다. `auth.users.last_sign_in_at`은 관리자 검사를 내장한 `SECURITY DEFINER` RPC로만 읽도록 마이그레이션을 작성했다.

## 알려진 이슈

- **관리자 사용자 현황 인증 E2E 대기**: 사용자가 운영 DB에 `admin_get_user_overview()` 마이그레이션 적용을 완료했다. 자동 브라우저에는 관리자 로그인 세션이 없고 Chrome 연동도 설치돼 있지 않아 인증 후 집계·목록 렌더링은 실사용 검증이 남았다.
- **월간 AI 보고서 실사용 E2E 미완료**: 인증 보호는 확인했으나 정상 Gemini 키를 통한 생성 성공 경로는 아직 실사용 검증하지 못했다.
- **자산 변동 기록 스냅샷 미갱신**: 같은 날 여러 번 자산을 수정하면 `asset_history.total_net_worth`가 최초 값에 고정된다. RLS UPDATE 경로 확인이 필요하다.
- **운영 DB 테스트 데이터 정리 필요**: `test_e2e_antigravity_1@example.com`, `cf-fixverify-1783040957@gmail.com` 관련 Auth·가구 데이터를 삭제해야 한다.
- Next.js 16 middleware → proxy 경고가 있으나 기능 영향은 없다.

## 다음 TODO

1. [ ] **(사용자)** 배포 후 관리자 계정으로 `/admin/users` 집계·목록·탭 이동을 확인한다.
2. [ ] **(Codex)** 로그인 가능한 브라우저 세션이 준비되면 비관리자 접근 차단까지 E2E 검증한다.
3. [ ] 프로덕션에서 월간 보고서 모바일 가독성과 정상 Gemini 키 생성 시간을 실사용 검증한다.
4. [ ] 자산 변동 기록 스냅샷 미갱신 버그를 Supabase 직접 조회로 조사·수정한다.
5. [ ] 운영 DB 테스트 데이터와 Auth 계정 2개를 정리한다.
