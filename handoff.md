# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.5 + AI 보고서 기간 확장 Phase 2 배포·검증 완료 + 도넛 차트 모바일 터치 재수정
- **검증 상태**: `npx tsc --noEmit`, `npx eslint .`, `npm run build` 모두 통과. 마이그레이션 적용 후 로컬·프로덕션 양쪽에서 `/reports/2026`(연간)·`/reports/2026-Q3`(분기)·`/reports/2026-H1`(반기)·`/reports/2026-07`(월간, 회귀 확인) 렌더 확인, 잘못된 값·미래 기간 redirect 확인, 콘솔·서버 에러 0건. 도넛 차트는 마우스 클릭 기준 회귀 없음 확인 — **실제 모바일 터치 재현은 사용자 확인 대기**
- **배포 상태**: 커밋 `bfafc55` 푸시 완료, Vercel 프로덕션 배포 `Ready` 확인
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **깃허브 저장소**: **PUBLIC 전환 완료** (2026-07-23) — https://github.com/StoneSilver0417/couple-finance
- **Supabase**: 단일 운영 프로젝트 사용. `20260724000000_periodic_reports.sql` **사용자가 Dashboard SQL Editor에서 수동 적용 완료**

## 최근 작업

- **도넛 차트 모바일 터치 재수정 (2026-07-24, Claude Code)**: 이전 세션에서 "퍼센트 라벨 pointer-events" 수정을 배포·검증(Playwright 마우스 클릭 기준)까지 마쳤으나, 사용자가 실제 폰(터치)에서 재현해보니 퍼센트 라벨과 색칠된 조각 둘 다 여전히 두 번 눌러야 선택됐다. 재조사 결과 진짜 원인은 `<Pie>`의 `onMouseEnter`/`onMouseLeave`(형제 조각 opacity를 dim시키는 hover 효과)였다 — 모바일 웹에서 hover 리스너가 달린 요소는 첫 탭을 hover 미리보기로만 처리하고 click은 두 번째 탭까지 미루는 동작이 잘 알려져 있는데, 정확히 이 패턴이었다(뷰포트에 `maximumScale:1`이 이미 있어 300ms 탭 지연 문제는 아니었음). 터치 기기 감지 후 hover 핸들러 자체를 걸지 않도록 수정(데스크톱 마우스 hover는 그대로 유지), 커밋(`bfafc55`)·배포. Playwright는 실제 터치 이벤트를 이 환경에서 재현할 수 없어(`hasTouch` 미지원) 마우스 클릭 기준 회귀 없음만 확인했고, 실제 터치 재현 확인은 사용자에게 요청함.
- **AI 보고서 Phase 2 배포 완료 (2026-07-24, Codex 구현 + Claude Code 검토/수정/배포)**: Codex가 신규 `periodic_reports` 테이블, `getPeriodRange`, `generatePeriodicReport`, 기간별 Gemini 프롬프트/집계, `/reports/[period]` 라우트와 월·분기·반기·연간 탭을 구현. 기존 월간 액션·테이블·JSON 키·`/reports/YYYY-MM` 경로는 보존됨을 diff로 직접 확인. 검토 중 Codex가 "새 npm 의존성 금지" 제약을 우회하려고 입력 검증에 Next.js 비공개 내부 경로(`next/dist/compiled/zod`)를 끌어다 쓴 것을 발견 — 이 저장소의 다른 서버 액션은 전부 zod 없이 수동 검증만 쓰고 있고 내부 경로는 버전업 시 경고 없이 사라질 수 있어, 정규식 기반 수동 검증(`parsePeriodicReportInput`)으로 교체하고 가짜 타입 선언 파일을 삭제함. 사용자가 마이그레이션을 Dashboard에서 수동 적용한 뒤, 로컬·프로덕션 양쪽에서 4가지 기간 유형과 잘못된 값·미래 기간 redirect, 기존 월간 경로 회귀 여부를 Playwright로 직접 확인 후 커밋(`adc2bac`)·배포.
- **검증/호환성 보강 (2026-07-24, Codex)**: 월간 하위호환·기간 계산·UI 접근성을 독립 리뷰하고 발견된 탭 대비와 2000년 하한 이동을 수정했다. Next 16 프로덕션 타입 검사에서 발견된 기존 라우트 3곳의 Promise 타입 선언도 무동작 교정했다.

## 알려진 이슈

- **Phase 2 실사용 생성 E2E 미완료**: 연간 요약 E2E 테스트 계정에 Gemini API 키가 등록돼 있지 않아, 분기/반기/연간 보고서의 실제 Gemini 생성→`periodic_reports` 저장 경로까지는 검증하지 못했다(라우팅·redirect·회귀는 검증 완료). 월간 보고서도 동일한 이유로 실사용 생성 미검증 상태다(아래 항목과 동일 원인).
- **관리자 화면 실사용 재확인 필요**: 사용자가 가입일 교정 SQL 적용을 완료했다. 배포 후 실제 기기에서 가입일과 카드 정렬이 의도대로 보이는지 확인이 필요하다.
- **월간 AI 보고서 실사용 E2E 미완료**: 인증 보호는 확인했으나 정상 Gemini 키를 통한 생성 성공 경로는 아직 실사용 검증하지 못했다.
- **자산 변동 기록 스냅샷 미갱신**: 같은 날 여러 번 자산을 수정하면 `asset_history.total_net_worth`가 최초 값에 고정된다. RLS UPDATE 경로 확인이 필요하다.
- **운영 DB 테스트 데이터 정리 필요**: 테스트 2개 + 연간 요약 E2E 계정은 정리 대상이다. README 스크린샷용 데모 가구는 재촬영용으로 유지 권장.
- Next.js 16 middleware → proxy 경고가 있으나 기능 영향은 없다.

## 다음 TODO

1. [ ] 도넛 차트 모바일 터치 재수정(`bfafc55`)이 실제 폰에서 한 번 탭으로 선택되는지 사용자 재확인 필요 — 여전하면 추가 조사.
2. [ ] 정상 Gemini API 키를 등록한 계정으로 월간·분기·반기·연간 보고서 실제 생성·재생성 E2E를 수행한다.
3. [ ] 실제 보고서 예산 사용률이 홈 지출 분석과 같은지 확인하고 필요하면 기존 월간 보고서를 재생성한다.
4. [ ] 자산 변동 기록 스냅샷 미갱신 버그를 조사·수정하고 운영 DB 테스트 계정을 정리한다.
