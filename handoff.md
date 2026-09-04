# Handoff & Maintenance Guide

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
