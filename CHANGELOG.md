# Changelog

## 2026-06-11

### v0.6.3 - 서버 액션 전면 보안 리팩토링

- **공개 엔드포인트 격리 (High)**
  - `lib/balance-actions.ts`: `syncMonthlyBalance`가 공개 서버 액션으로 노출되어 인증 없이 임의 가구 ID로 호출 가능했던 문제 → `"use server"` 제거, 호출자의 Supabase 클라이언트를 전달받는 서버 내부 모듈로 전환
  - `lib/activity-log.ts` (신규): 기존 `createActivityLog` 공개 액션으로 누구나 활동 로그를 위조 삽입할 수 있던 문제 → 내부 함수 `logActivity`로 격리, `activity-log-actions.ts`는 조회/삭제 액션만 유지
- **공통 모듈 추출 (리팩토링)**
  - `lib/supabase/household-context.ts` (신규): 로그인 확인 + 가구 ID 조회를 `getHouseholdContext()` 단일 진입점으로 통합. 액션마다 중복되던 인증/소속 확인 보일러플레이트 제거 (13개 파일, 약 -565줄)
  - `lib/validation.ts` (신규): 금액(상한 1천억, 유한성), 날짜(YYYY-MM-DD), 연/월 범위, 문자열 길이, 거래/자산 유형 화이트리스트 등 외부 입력 검증 유틸 집중화
- **외부 입력 검증 강화 (Medium)**
  - 모든 서버 액션에서 `formData.get(...) as string` 무검증 캐스팅 제거
  - `feedback-actions.ts`: 피드백 유형 화이트리스트, 내용 5,000자 제한, `deviceInfo` JSON 안전 파싱(2,000자 제한)
  - `admin-actions.ts`: 피드백 상태값 화이트리스트, 답변 길이 제한
  - `household-actions.ts`: 가구명/사용자명 50자 제한, 초대 코드 null 입력 시 `.toUpperCase()` 크래시 방어
  - `auth-actions.ts`: 이메일/비밀번호 존재·길이 검증 추가 (비밀번호 6자 미만 사전 차단)
- **보안 헤더 및 빌드 설정 개선 (Medium)**
  - `next.config.ts`: 프로덕션 CSP에서 `'unsafe-eval'` 제거 (개발 모드 HMR에서만 허용)
  - 폐기된 `X-XSS-Protection` 헤더를 `Referrer-Policy: strict-origin-when-cross-origin`으로 교체
  - `typescript.ignoreBuildErrors: true` 제거 → 빌드 시 타입 오류 강제 검출

## 2026-05-16

### v0.6.2 - 거래 복사 기능 추가

- **거래 복사 기능 (Copy & Paste Transactions)**
  - 파일: `app/(app)/transactions/transactions-list-client.tsx`, `components/calendar/day-transactions-modal.tsx`, `app/(app)/transactions/new/page.tsx`
  - 내용: 기존 거래 항목(메인 목록 및 캘린더 모달)에 '복사' 메뉴 추가. 클릭 시 기존 거래의 금액, 카테고리, 메모 등의 정보를 URL 쿼리스트링에 담아 새 거래 추가 폼에 자동으로 채워주는 기능 구현. 매월 반복되거나 비슷한 거래를 빠르게 입력 가능.
## 2026-05-14

### v0.6.1 - 거래 삭제 버그 수정

- **`ConfirmDialog` Promise 미해결 버그 수정 (Critical)**
  - 파일: `components/ui/confirm-dialog.tsx`
  - 원인: `useState`의 setter(`setResolveRef(() => resolve)`)에 함수를 전달하면 React가 이를 "함수형 업데이트(functional update)"로 해석, `resolve`를 state setter의 인자로 **즉시 호출**하고 반환값(`undefined`)을 state에 저장함
  - 결과: `resolveRef`가 항상 `null`이므로 확인/취소 버튼 클릭 시 `Promise`가 영원히 pending 상태 → `await confirm()`이 반환되지 않아 `deleteTransaction` 등 후속 삭제 로직이 절대 실행되지 않음
  - 수정: `useState` → `useRef`로 교체. `resolveRef.current`에 함수 참조를 직접 저장하여 React의 함수형 업데이트 해석을 우회

## 2026-02-12

### v0.6.0 - 보안 아키텍처 대규모 강화

- **RPC 함수 보안 취약점 해결 (High)**
  - `create_household_with_owner`, `join_household_as_member` 함수 인자에서 유저 ID 제거
  - SQL 내부에서 `auth.uid()`를 직접 참조하도록 변경하여 인자 조작을 통한 권한 탈취 원천 차단
- **초대 코드 생성 보안 강화 (Medium)**
  - `Math.random()`을 암호학적으로 안전한 `crypto.randomBytes`로 교체
- **서버 단 이중 소유권 검증 도입 (Defense in Depth)**
  - 거래(Transaction), 카테고리(Category), 자산(Asset)의 수정/삭제 시 서버 액션에서 가구 ID 일치 여부를 명시적으로 재검증
  - DB RLS와 애플리케이션 계층의 이중 보안 체계 구축
- **코드 품질 및 안정성 개선**
  - Next.js Server Actions의 타입 안전성 및 가독성 향상

## 2026-02-10

### v0.5.5 - 관리자용 피드백 답변 시스템 완료

- **개발자 전용 관리자 콘솔 추가**
  - `waterdrop11@naver.com` 계정 전용 관리자 페이지 구축
  - 사용자 문의 내역 상세 조회 및 답변(admin_comment) 작성 기능
  - 기기 정보(OS, 브라우저 등) 확인 기능으로 버그 대응력 강화
- **보안 및 RLS 정책 강화**
  - Supabase RLS를 JWT 기반 이메일 검증 방식으로 개선하여 보안성 확보
  - `feedbacks` 테이블 생성 및 `profiles` 조인 최적화
- **사용자 문의 환경 개선**
  - '내 문의함' 기능으로 답변 상태 실시간 확인 가능
  - 카카오톡 대신 이메일/앱 내 문의로 간편화

### v0.5.0 - 고객 지원 및 피드백 시스템 구축

- **고객 지원 창구 개설**
  - 설정 페이지 하단에 '고객 지원' 섹션 추가
  - '문의하기' 모달을 통해 앱 내 의견 보내기 및 이메일 문의 바로가기 제공
  - React 19 `useActionState`를 활용한 서버 액션 기반 폼 처리 구현
- **데이터베이스 구축**
  - `feedbacks` 테이블 및 RLS 정책 생성

## 2026-02-09

### v0.4.7 - 자산 그래프 인터랙션 최적화

- **포트폴리오 차트 사용자 경험 개선**
  - 차트 배경 클릭 시 선택 해제 기능 추가 (직관적인 해제 동작)
  - 파이 조각 클릭 시 이벤트 전파(Propagation) 방지 처리로 반응 속도 및 정확도 향상

### v0.4.6 - 자산 포트폴리오 차트 인터랙션 개선

- **포트폴리오 차트 클릭 동작 수정**
  - 마우스 호버(`hover`)와 클릭 선택(`select`) 상태 로직 분리
  - 특정 항목 선택 상태에서 다른 항목 클릭 시 즉시 전환되도록 개선 (기존: 해제 후 재클릭 필요했던 문제 해결)
  - 동일 항목 재클릭 시 선택 해제 기능 유지

### v0.4.5 - 예산실적분석 UI 개선 및 자산 관리 동기화

- **예산실적분석 페이지 항목별 리스트 디자인 개선**
  - 자산 탭의 포트폴리오 레전드와 동일한 라운드 카드 스타일 적용
  - 항목별 고유 색상을 활용한 배경색 및 테두리 적용
  - 금액 표시 형식을 'OO만원', 'O.O억' 단위로 간소화하여 가독성 개선
  - 지출 항목별 비율(%) 표시 배지 추가

### v0.4.4 - 자산 차트 개선, 가계부 카테고리 상세, 카테고리 소프트 삭제

- **자산 포트폴리오 차트 개선**
  - Recharts Tooltip/activeShape 완전 제거 → 네모박스/검은 테두리 해결
  - 클릭 시 Total 아래에 한 줄로 자산 정보 표시
- **가계부 탭 카테고리별 상세 펼침**
  - 수입/지출 카드 클릭 시 카테고리별 목록 (비율 프로그레스바)
- **카테고리 삭제 소프트 삭제로 통합**
  - deleteCategory: 하드 삭제 → `is_hidden=true` (기본/커스텀 모두)
  - 설정 하단에 "삭제된 카테고리" 접이식 복원 섹션
