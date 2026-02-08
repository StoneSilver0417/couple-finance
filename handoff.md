# Couple Finance - Handoff

## 현재 상태
- **버전**: v0.4.0
- **빌드 상태**: 성공
- **배포 상태**: 로컬 빌드 확인 완료 (배포 필요)
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master

## Supabase 환경
| 환경 | URL | 용도 |
|------|-----|------|
| 개발 | `tsqrohamnjtqocmnokmo.supabase.co` | 로컬 개발/테스트 |
| 운영 | `bgevpihfcvraxososcll.supabase.co` | 프로덕션 |

## Vercel 환경변수 (설정 완료)
- `NEXT_PUBLIC_SUPABASE_URL` - 운영 DB URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 운영 anon key (JWT 형식)

## Supabase 설정 (완료)
- **Site URL**: https://couple-finance-roan.vercel.app
- **Redirect URLs**: https://couple-finance-roan.vercel.app/**
- **uuid-ossp 확장**: 활성화됨
- **RLS INSERT 정책**: households, profiles 추가됨
- **RPC 함수**: create_household_with_owner, join_household_as_member 생성됨

## 최근 작업 (2026-02-08)
- 활동기록 개선
  - action_type 한글 표시 (CREATE→추가, UPDATE→수정, DELETE→삭제)
  - 프로필 이름 표시에서 불필요한 "님이" 접미사 제거
  - 거래 수정(UPDATE) 시 활동기록 로깅 추가 (transaction-update-action.ts)
  - 예산 설정 시 활동기록 로깅 추가 (budget-actions.ts)
  - 카테고리 생성/수정/삭제 시 활동기록 로깅 추가 (category-actions.ts)
- 거래내역 모달 가로 스크롤 수정
  - DialogContent에 overflow-x-hidden 적용
  - 패딩 축소 (p-6 → p-5)
  - 금액 영역에 shrink-0, whitespace-nowrap 적용
  - 아이콘 영역에 shrink-0 적용
  - 요약 카드에 min-w-0, truncate 적용
  - gap 축소 (gap-3 → gap-2)로 여유 공간 확보

## 알려진 이슈
- Next.js 16 middleware → proxy 경고 (기능 문제 없음)

## 다음 TODO
1. [ ] 프로덕션 배포
2. [ ] 활동기록 표시 실기기 테스트
3. [ ] 추가 UI/UX 개선
