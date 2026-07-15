# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.4 + 신규 부부 공동 가계부 앱 아이콘 적용 완료
- **빌드 상태**: 성공 (`npx tsc --noEmit`, `npx eslint .` 0 오류·0 경고, `npm run build` 통과)
- **배포 상태**: 최신 `master` 자동 프로덕션 배포 운영. 직전 보고서 정렬 커밋 `b7b1613` 배포 `Ready`, 신규 아이콘도 푸시 후 자동 배포
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **Supabase**: 개발/운영 분리 없이 `ieahmpxiaamesrnfgbng.supabase.co` 단일 프로젝트 사용

## 최근 작업

- **신규 앱/PWA 아이콘 적용 (2026-07-15)**: 사용자가 제공한 `부부공동 가계부` 일러스트를 변형 없이 192·512px PWA 아이콘, 180px Apple 홈 화면 아이콘, 48px favicon으로 내보냈다. manifest의 `any maskable` 용도와 Next.js 메타데이터 아이콘 경로도 각 규격에 맞게 갱신했다.
- **(완료) 홍보용 README + 사용법 가이드 제작 (2026-07-15)**: README.md 전면 재작성(컨셉·핵심 가치·주요 기능·스크린샷 갤러리·기술 스택), `docs/USAGE.md` 신설(회원가입→가구 초대→거래→달력→예산/분석→자산→AI 보고서 키 발급→PWA 설치→FAQ). 스크린샷 9종은 데모 가구를 만들어 프로덕션에서 Playwright 모바일 뷰포트(390×844)로 직접 촬영해 `docs/images/`에 저장.

## 알려진 이슈

- **관리자 화면 실사용 재확인 필요**: 사용자가 가입일 교정 SQL 적용을 완료했다. 배포 후 실제 기기에서 가입일과 카드 정렬이 의도대로 보이는지 확인이 필요하다.
- **월간 AI 보고서 실사용 E2E 미완료**: 인증 보호는 확인했으나 정상 Gemini 키를 통한 생성 성공 경로는 아직 실사용 검증하지 못했다.
- **자산 변동 기록 스냅샷 미갱신**: 같은 날 여러 번 자산을 수정하면 `asset_history.total_net_worth`가 최초 값에 고정된다. RLS UPDATE 경로 확인이 필요하다.
- **운영 DB 테스트 데이터 정리 필요**: `test_e2e_antigravity_1@example.com`, `cf-fixverify-1783040957@gmail.com` 관련 Auth·가구 데이터를 삭제해야 한다.
  - **주의**: README 스크린샷용 데모 가구 `cf-demo-readme@gmail.com`("도준이네 가계부", 거래 14건·자산 4건·예산 250만원)도 생성됨 — 단, **스크린샷 재촬영에 재사용 가치가 있으므로 당장 지우지 말고 유지 권장**. 지울 경우 위 두 계정과 동일한 방식으로 정리.
- Next.js 16 middleware → proxy 경고가 있으나 기능 영향은 없다.

## 다음 TODO

1. [ ] 설치된 PWA는 아이콘 캐시가 남을 수 있으므로 재설치 후 신규 홈 화면 아이콘을 확인한다.
2. [ ] 프로덕션에서 정상 Gemini 키 생성 시간을 실사용 검증한다.
3. [ ] 자산 변동 기록 스냅샷 미갱신 버그를 Supabase 직접 조회로 조사·수정한다.
4. [ ] 운영 DB 테스트 데이터와 Auth 계정 2개를 정리한다.
