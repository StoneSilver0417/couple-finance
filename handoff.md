# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.4 + 월간 AI 보고서 구현·배포 완료, Gemini 한도 오류 상세화 반영 중
- **빌드 상태**: 성공 (`npx tsc --noEmit`, `npx eslint .` 0 오류·0 경고, `npm run build` 통과)
- **배포 상태**: 직전 프로덕션 배포 완료(2026-07-15, 무료 한도 완화 커밋 `cb6a3a6`, Vercel `dpl_HYo97NpEUUrYZr5BrHRTDqxHMzdh` `Ready`). 이번 한도 오류 상세화 변경은 커밋/배포 예정
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **Supabase**: 개발/운영 분리 없이 `ieahmpxiaamesrnfgbng.supabase.co` 단일 프로젝트 사용

## 최근 작업

- **Gemini 한도 오류 상세화 (2026-07-15)**: 사용자가 새 프로젝트/새 키에서도 같은 한도 문구가 뜬다고 보고했다. Gemini 비정상 응답 본문을 파싱해 429의 quota violation detail/message를 화면 오류와 서버 로그에 반영하도록 변경했다. 다음 재시도에서 RPD/RPM/TPM/프로젝트 subject 등 실제 원인 단서가 보일 수 있다.
- **Gemini 무료 한도 완화 대응 (2026-07-15, `cb6a3a6`)**: 사용자가 다른 Google 계정의 신규 키를 적용해도 무료 한도 오류가 지속된다고 보고했다. 월간 보고서는 짧은 JSON 생성이라 기본 모델을 `gemini-2.0-flash`에서 `gemini-2.0-flash-lite`로 낮춰 한도 소모를 줄였고, 등록된 키가 있어도 삭제 없이 새 키로 교체 저장할 수 있도록 설정 다이얼로그에 교체 폼을 추가했다. 429 오류 문구도 AI Studio 프로젝트 한도 확인을 안내하도록 수정했다.
- **Gemini 신규 API 키 형식 대응 배포 완료 (2026-07-15, `3fe5275`)**: Google AI Studio가 새 키를 Auth key로 생성하면서 `AQ...` 등 `AIza`가 아닌 prefix가 나오는 상태를 확인했다. 앱의 `AIza` prefix 강제 검증을 제거하고 실제 Gemini API 검증 결과로만 저장 여부를 판단하도록 변경했다. Gemini REST 호출은 공식 문서 방식에 맞춰 query string `?key=` 대신 `x-goog-api-key` 헤더를 사용하도록 수정했고, 설정 화면 placeholder와 마스킹도 특정 prefix에 의존하지 않게 바꿨다.
- **월간 AI 보고서 구현·배포 완료 (2026-07-15, `6974aff`)**: 사용자가 운영 Supabase에 신규 테이블/RLS SQL 적용을 완료했다. 가구별 Gemini 키 관리, 서버 집계·Gemini 구조화 응답, `/reports/[yearMonth]` 보고서 화면, 설정 진입점과 재생성을 구현해 Vercel 프로덕션에 배포했다. 키 원문은 서버에서만 읽고 클라이언트에는 마스킹 값만 전달하며, Gemini에는 메모 없이 집계와 고액 지출 5건만 전송한다.
- **긴 기간 자산 추이 그래프 개선 (2026-07-03, `d780d70`)**: 30개 초과 포인트를 구간별 최신값으로 다운샘플링해 지글거림을 완화했고 프로덕션 검증까지 완료했다.

## 알려진 이슈

- **월간 AI 보고서 실사용 E2E 미완료**: 인증 전 `/reports/2026-07` 접근이 `/login`으로 보호되는 것은 확인했다. 브라우저에 로그인 세션과 정상 Gemini API 키가 없어 키 등록·마스킹·생성·재생성·빈 거래 월 토스트는 아직 실사용 검증하지 못했다.
- **자산 변동 기록 스냅샷 미갱신**: 같은 날 여러 번 자산을 수정하면 `asset_history.total_net_worth`가 최초 값에 고정된다. `saveAssetSnapshot()` upsert는 오류를 내지 않아 RLS UPDATE 경로 확인이 필요하다. 사용자는 Supabase PAT를 발급받았고 조사는 보류 중이다.
- **운영 DB 테스트 데이터 정리 필요**: `test_e2e_antigravity_1@example.com`("Test Household"), `cf-fixverify-1783040957@gmail.com`("버그검증 가계부") 가구 및 Auth 계정을 삭제해야 한다.
- Next.js 16 middleware → proxy 경고가 있으나 기능 영향은 없다.

## 다음 TODO

1. [ ] Gemini 신규 Auth key(`AQ...`) 교체 저장 후 보고서 생성을 재시도하고, 새로 노출되는 429 상세 문구 또는 Vercel 로그의 quota detail을 확인한다.
2. [ ] 프로덕션에서 정상 키로 보고서 생성 시간을 측정해 `maxDuration=60` 이내 완료 여부를 확인한다.
3. [ ] 자산 변동 기록 스냅샷 미갱신 버그를 Supabase 직접 조회로 조사·수정한다.
4. [ ] 운영 DB 테스트 데이터와 Auth 계정 2개를 정리한다.
5. [ ] 관리자 페이지 기능을 고도화한다.
