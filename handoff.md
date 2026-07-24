# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.4 + AI 보고서 기간 확장 Phase 2 로컬 구현·검토·수정 완료
- **검증 상태**: 네트워크 제한 없는 로컬 환경에서 `npx tsc --noEmit`, `npx eslint .`, `npm run build`(Turbopack, 폰트 mock 불필요) 모두 통과. `getPeriodRange` 14개 경계 시나리오, 보고서 6개 URL 서버 리다이렉트도 확인됨(Codex 검증)
- **배포 상태**: 코드·문서 로컬 커밋 완료. **git push·Vercel 배포는 보류** — DB 마이그레이션이 포함돼 있어 운영 DB 수동 적용 전까지 배포하지 않는다
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **깃허브 저장소**: **PUBLIC 전환 완료** (2026-07-23) — https://github.com/StoneSilver0417/couple-finance
- **Supabase**: 단일 운영 프로젝트 사용. 신규 `20260724000000_periodic_reports.sql`은 저장소에만 작성했고 **운영 DB에는 미적용**

## 최근 작업

- **AI 보고서 Phase 2 구현 (2026-07-24, Codex 구현 + Claude Code 검토/수정)**: Codex가 신규 `periodic_reports` SQL 초안, `getPeriodRange`, `generatePeriodicReport`, 기간별 Gemini 프롬프트/집계, `/reports/[period]` 라우트와 월·분기·반기·연간 탭을 구현. 기존 월간 액션·테이블·JSON 키·`/reports/YYYY-MM` 경로는 보존됨을 diff로 직접 확인. 검토 중 Codex가 "새 npm 의존성 금지" 제약을 우회하려고 입력 검증에 Next.js 비공개 내부 경로(`next/dist/compiled/zod`)를 끌어다 쓴 것을 발견 — 이 저장소의 다른 서버 액션은 전부 zod 없이 수동 검증만 쓰고 있고 내부 경로는 버전업 시 경고 없이 사라질 수 있어, 정규식 기반 수동 검증(`parsePeriodicReportInput`)으로 교체하고 가짜 타입 선언 파일을 삭제함. 이후 로컬에서 tsc/eslint/build 재통과 확인, 커밋만 하고 푸시는 보류.
- **검증/호환성 보강 (2026-07-24, Codex)**: 월간 하위호환·기간 계산·UI 접근성을 독립 리뷰하고 발견된 탭 대비와 2000년 하한 이동을 수정했다. Next 16 프로덕션 타입 검사에서 발견된 기존 라우트 3곳의 Promise 타입 선언도 무동작 교정했다.

## 알려진 이슈

- **Phase 2 운영 적용·실데이터 E2E 대기**: 사용자가 `20260724000000_periodic_reports.sql`을 Dashboard SQL Editor에서 수동 적용하기 전에는 분기/반기/연간 생성·재생성 E2E를 실행할 수 없다. 마이그레이션 적용 전에 배포하면 분기/반기/연간 탭은 보이지만 보고서 생성 시 테이블 없음 오류가 난다 — 반드시 마이그레이션 적용 후 배포할 것.
- **관리자 화면 실사용 재확인 필요**: 사용자가 가입일 교정 SQL 적용을 완료했다. 배포 후 실제 기기에서 가입일과 카드 정렬이 의도대로 보이는지 확인이 필요하다.
- **월간 AI 보고서 실사용 E2E 미완료**: 인증 보호는 확인했으나 정상 Gemini 키를 통한 생성 성공 경로는 아직 실사용 검증하지 못했다.
- **자산 변동 기록 스냅샷 미갱신**: 같은 날 여러 번 자산을 수정하면 `asset_history.total_net_worth`가 최초 값에 고정된다. RLS UPDATE 경로 확인이 필요하다.
- **운영 DB 테스트 데이터 정리 필요**: 테스트 2개 + 연간 요약 E2E 계정은 정리 대상이다. README 스크린샷용 데모 가구는 재촬영용으로 유지 권장.
- Next.js 16 middleware → proxy 경고가 있으나 기능 영향은 없다.

## 다음 TODO

1. [ ] Supabase Dashboard SQL Editor에서 `20260724000000_periodic_reports.sql`을 수동 적용한다 (사용자 승인 필요).
2. [ ] 적용 후 기존 월간 + 신규 분기/반기/연간 각각 생성·재생성 E2E를 수행하고 이상 없으면 git push·Vercel 배포한다.
3. [ ] 실제 보고서 예산 사용률이 홈 지출 분석과 같은지 확인하고 필요하면 기존 월간 보고서를 재생성한다.
4. [ ] 프로덕션에서 정상 Gemini 키 생성 시간을 실사용 검증한다.
5. [ ] 자산 변동 기록 스냅샷 미갱신 버그를 조사·수정하고 운영 DB 테스트 계정을 정리한다.
