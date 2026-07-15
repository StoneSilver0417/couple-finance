# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.4 + 월간 AI 보고서 구현 완료(미커밋)
- **빌드 상태**: 성공 (`npx tsc --noEmit`, `npx eslint .` 0 오류·0 경고, `npm run build` 통과)
- **배포 상태**: 기존 버전 배포 완료(2026-07-03, 커밋 `d780d70`), 이번 변경은 미배포
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **Supabase**: 개발/운영 분리 없이 `ieahmpxiaamesrnfgbng.supabase.co` 단일 프로젝트 사용

## 최근 작업

- **월간 AI 보고서 구현 완료 (2026-07-15)**: 사용자가 운영 Supabase에 신규 테이블/RLS SQL 적용을 완료했다. 가구별 Gemini 키 관리, 서버 집계·Gemini 구조화 응답, `/reports/[yearMonth]` 보고서 화면, 설정 진입점과 재생성을 구현했다. 키 원문은 서버에서만 읽고 클라이언트에는 마스킹 값만 전달하며, Gemini에는 메모 없이 집계와 고액 지출 5건만 전송한다.
- **긴 기간 자산 추이 그래프 개선 (2026-07-03, `d780d70`)**: 30개 초과 포인트를 구간별 최신값으로 다운샘플링해 지글거림을 완화했고 프로덕션 검증까지 완료했다.

## 알려진 이슈

- **월간 AI 보고서 실사용 E2E 미완료**: 인증 전 `/reports/2026-07` 접근이 `/login`으로 보호되는 것은 확인했다. 브라우저에 로그인 세션과 정상 Gemini API 키가 없어 키 등록·마스킹·생성·재생성·빈 거래 월 토스트는 아직 실사용 검증하지 못했다.
- **자산 변동 기록 스냅샷 미갱신**: 같은 날 여러 번 자산을 수정하면 `asset_history.total_net_worth`가 최초 값에 고정된다. `saveAssetSnapshot()` upsert는 오류를 내지 않아 RLS UPDATE 경로 확인이 필요하다. 사용자는 Supabase PAT를 발급받았고 조사는 보류 중이다.
- **운영 DB 테스트 데이터 정리 필요**: `test_e2e_antigravity_1@example.com`("Test Household"), `cf-fixverify-1783040957@gmail.com`("버그검증 가계부") 가구 및 Auth 계정을 삭제해야 한다.
- Next.js 16 middleware → proxy 경고가 있으나 기능 영향은 없다.

## 다음 TODO

1. [ ] 정상 Gemini 무료 API 키로 설정 등록 → 마스킹 → 보고서 생성/재생성 E2E를 수행하고 네트워크 응답에 키 원문이 없는지 확인한다.
2. [ ] 월간 AI 보고서 변경을 검토해 커밋·배포하고 프로덕션에서 `maxDuration=60` 동작을 실측한다.
3. [ ] 자산 변동 기록 스냅샷 미갱신 버그를 Supabase 직접 조회로 조사·수정한다.
4. [ ] 운영 DB 테스트 데이터와 Auth 계정 2개를 정리한다.
5. [ ] 관리자 페이지 기능을 고도화한다.
