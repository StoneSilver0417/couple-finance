# Couple Finance - Handoff

## 현재 상태
- **버전**: v0.3.9
- **빌드 상태**: 성공
- **배포 상태**: 프로덕션 배포 완료
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master
- **최신 커밋**: aba71bc

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

## 최근 작업 (2026-02-05)
- 확인 모달 스타일 적용
  - ConfirmProvider 컨텍스트 및 useConfirm 훅 추가
  - 브라우저 기본 confirm() 대신 스타일된 모달 사용
  - 거래/카테고리/자산 삭제, 로그아웃에 모두 적용
  - danger/warning/default 변형 지원
- 결제수단 기능 완전 삭제
- 활동기록 쿼리 수정 (join → 별도 쿼리)
- 금액 표시 만/억 단위 적용
- 카테고리 색상 동적 적용

## 알려진 이슈
- Next.js 16 middleware → proxy 경고 (기능 문제 없음)

## 다음 TODO
1. [ ] 활동기록 표시 확인 테스트
2. [ ] 추가 UI/UX 개선
