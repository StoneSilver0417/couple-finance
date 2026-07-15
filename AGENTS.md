# Couple Finance (부부 공동 가계부) — 프로젝트 규칙

> 베이스 규칙: `D:\workspace\AGENTS.md`를 먼저 읽고 따른다. (자동 로드되지 않은 경우 직접 읽을 것)
> 현재 진행 상태·TODO는 `handoff.md`, 과거 이력은 `CHANGELOG.md` 참고.

## 개요
- 부부가 함께 쓰는 공동 가계부 웹 앱 (PRD: `PRD_부부공동가계부_v2.0.md`)
- 프로덕션 URL: https://couple-finance-roan.vercel.app
- 관리자 계정: waterdrop11@naver.com

## 기술 스택
- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Supabase (인증, DB, RPC) — 마이그레이션은 `supabase/` 폴더
- Vercel 배포 (git push 시 자동 배포, CLI 설치·인증 완료)

## 주요 명령어
```bash
npm run dev        # 개발 서버
npm run build      # 프로덕션 빌드
npx tsc --noEmit   # 타입 체크
npx eslint .       # 린트
```

## 환경 (Supabase)
| 환경 | URL                                | 용도             |
| ---- | ---------------------------------- | ---------------- |
| 개발 | `tsqrohamnjtqocmnokmo.supabase.co` | 로컬 개발/테스트 |
| 운영 | `bgevpihfcvraxososcll.supabase.co` | 프로덕션         |

- 환경 변수: `.env.local`(개발), `.env.vercel`(운영 참고)
- 문제 발생 시 롤백: `vercel rollback` 또는 `git revert <커밋>` 후 푸시

## 프로젝트 고유 규칙
- 서버 액션은 입력 검증(zod) 필수, 공개 액션 노출 금지 (v0.6.3 보안 리팩토링 기준 유지)
- React 19 권장 패턴 사용 (setState-in-effect 금지: key 리마운트, 액션 래퍼 등)
- 예산 사용률은 `설정 예산 대비 변동지출`로만 계산한다. 고정·비정기 지출은 제외하고 `calculateBudgetUsagePercent()` 공통 함수를 사용한다.
- Supabase MCP 추가 시: PAT 발급 후
  `claude mcp add supabase --env SUPABASE_ACCESS_TOKEN=<토큰> -- cmd /c npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=bgevpihfcvraxososcll`
