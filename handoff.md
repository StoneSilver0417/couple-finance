# Handoff & Maintenance Guide

## 2026-09-05 최신 전체 리팩토링 핸드오프 (Phase 0~4)

### 1. 주요 변경 내역 요약
- **Phase 0 (인증 레이아웃 격리 & 접근성/CTA 개선)**:
  - `BottomNav`를 `app/(app)/layout.tsx`로 이동하여 로그인/회원가입 등 인증 화면에서 불필요한 하단 바 미노출.
  - Viewport `maximumScale: 1` 제거로 확대 접근성 복구 및 safe-area 하단 padding을 넉넉히 주어 CTA 겹침 방지.
  - ESLint 오류 유발하던 `scripts/clear-reports.js`를 ES Module(`clear-reports.mjs`)로 수정.
- **Phase 1 (디자인 토큰 & Pretendard 폰트 & DESIGN.md 명세)**:
  - 루트 `DESIGN.md` 작성 (8px 그리드, border-radius, 색상 토큰, 모션 축소 가이드라인).
  - Pretendard 가변 폰트 적용 및 `tabular-nums`, `prefers-reduced-motion` 전역 유틸리티 반영.
- **Phase 2 (이모지 지양 & Lucide 아이콘 표준화 & 접근성 강화)**:
  - 전역 UI 이모지(`💡`, `✅`, `✨` 등)를 `lucide-react` 아이콘으로 전환하고 `aria-label`, `aria-hidden` 및 터치 타깃 44px 이상 확보.
- **Phase 3 (PWA 오프라인 Fallback)**:
  - `/offline` 정적 캐시 오프라인 전용 안내 페이지 신설 및 Service Worker (`public/sw.js` v4) 오프라인 응답 구현. `scripts/test-service-worker.mjs` 검증 통과 (15/15).
- **Phase 4 (Zod 입력 검증 & Unsafe 타입 캐스팅 제거)**:
  - `zod` 패키지 설치 및 `lib/schemas.ts` 생성 후 `lib/transaction-actions.ts`, `lib/asset-actions.ts`에 Zod safeParse 반영.
  - `lib/report-actions.ts` 내 Unsafe `as` 캐스팅을 `asTransactionRpcRows` 헬퍼 함수로 치환.

### 2. 검증 완료 사항
- `npx tsc --noEmit` & `npm run lint` 100% 정상 통과.
- `npm run build` 프로덕션 빌드 성공.
- `node --test scripts/test-service-worker.mjs` 단위 테스트 15개 전체 통과.
- Git 원격 저장소(`origin/master`) 커밋 및 푸시 완료.

## 2026-09-04 최신 작업 핸드오프

### 1. 주요 변경 내역 요약
- **Gemini API 복구 및 모델 업그레이드**: `gemini-2.0-flash-lite`(종료됨) -> `gemini-2.5-flash`로 변경하여 AI 보고서 생성 통신 실패를 복구했습니다.
- **PWA 서비스 워커 네트워크 우선(Network-First) 변경**: `public/sw.js` (버전 `v3`)에서 Supabase 데이터 호출 및 HTML 네비게이션이 캐시되지 않고 즉시 서버에서 받아오도록 갱신했습니다.
- **보안 강화**: `/api/admin/clear-reports` 엔드포인트에 `is_admin` 인가 검증을 추가했고, 거래 추가/수정 시 가구(`household_id`)에 속한 카테고리/소유자 ID인지 교차 검증(`lib/transaction-validation.ts`)을 적용했습니다.
- **Serverless 비동기 처리 안정화**: `(async () => { ... })()` 형태의 리턴 후 비동기 IIFE 패턴을 완전히 제거하여 Vercel Serverless 실행 시 데이터 재계산 및 로깅 누락을 방지했습니다.
- **페이징 및 성능**: Admin/Feedback API 쿼리에 기본 50개 리밋/오프셋 페이징을 추가했습니다.

### 2. 검증 완료 사항
- `npm run build` 프로덕션 빌드 정상 통과 (0 TypeScript / Lint errors).
- Playwright Headless Browser 및 `curl`을 통한 로컬 및 PWA 렌더링 정상 동작 검증 완료.
- GitHub `master` 브랜치 커밋 및 푸시 완료 (`88234f0`, `2ae8d4a`).

### 3. 다음 작업 시 유의사항
- 사용자 개인 Gemini API Key는 설정 페이지(`/settings`)에서 등록하여 사용할 수 있으며, 키가 없거나 쿼터 초과 시 유연한 구조화 분석 리포트 화면으로 동작합니다.
