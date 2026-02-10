# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.5.0
- **빌드 상태**: 성공
- **배포 상태**: 프로덕션 배포 완료 (GitHub Push 완료)
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master
- **최신 커밋**: 02b1672

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

## 최근 작업 (2026-02-10)

- 고객 지원 및 피드백 시스템 구축
  - 설정 페이지에 '고객 지원' 섹션 및 문의하기 모달 추가
  - `feedbacks` 테이블 생성 및 서버 액션 연동
  - 카카오톡 오픈채팅 및 이메일 문의 바로가기 제공
- React 19 `useActionState` 적용 및 shadcn/ui 기반 컴포넌트 구현

## 알려진 이슈

- Next.js 16 middleware → proxy 경고 (기능 문제 없음)

## 다음 TODO

1. [ ] 추가 UI/UX 개선 및 사용자 피드백 반영
