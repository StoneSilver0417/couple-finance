# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.4.6
- **빌드 상태**: 성공
- **배포 상태**: 프로덕션 배포 완료 (GitHub Push 완료)
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master
- **최신 커밋**: 266c871

## Supabase 환경

| 환경 | URL                                | 용도             |
| ---- | ---------------------------------- | ---------------- |
| 개발 | `tsqrohamnjtqocmnokmo.supabase.co` | 로컬 개발/테스트 |
| 운영 | `bgevpihfcvraxososcll.supabase.co` | 프로덕션         |

## Vercel 환경변수 (설정 완료)

- `NEXT_PUBLIC_SUPABASE_URL` - 운영 DB URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 운영 anon key (JWT 형식)

## Supabase 설정 (완료)

- **Site URL**: https://couple-finance-roan.vercel.app
- **Redirect URLs**: https://couple-finance-roan.vercel.app/**
- **uuid-ossp 확장**: 활성화됨
- **RLS INSERT 정책**: households, profiles 추가됨
- **RPC 함수**: create_household_with_owner, join_household_as_member, get_my_household_id 생성됨

## 최근 작업 (2026-02-09)

- 자산 포트폴리오 차트 인터랙션 개선
  - 선택/호버 상태 분리: 다른 항목 클릭 시 즉시 선택 전환
- 예산실적분석 페이지 항목별 리스트 디자인 개선
  - 자산 탭 포트폴리오 스타일과 디자인 통일
  - 금액 표시 간소화 (만원/억 단위) 및 비율 표시 추가
- 자산 차트 개선 (검은 테두리 해결, 정보 표시 최적화)
- 자산변동기록 도움말 안내 박스 추가

## 알려진 이슈

- Next.js 16 middleware → proxy 경고 (기능 문제 없음)

## 다음 TODO

1. [ ] 추가 UI/UX 개선 및 사용자 피드백 반영
