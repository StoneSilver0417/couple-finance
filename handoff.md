# Couple Finance - Handoff

## 현재 상태
- **버전**: v0.4.3
- **빌드 상태**: 성공
- **배포 상태**: 프로덕션 배포 완료
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master
- **최신 커밋**: 6dfe7ea

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
- **RPC 함수**: create_household_with_owner, join_household_as_member, get_my_household_id 생성됨

## 최근 작업 (2026-02-08)
- 활동기록 "방금 전" 버그 수정
  - created_at NULL fallback을 현재 시간 → 빈 문자열로 변경
  - Supabase 쿼리에 NULL/비정상 날짜 필터링 추가
  - 활동기록 초기화 기능 추가 (clearActivityLogs + UI 버튼)
  - activity_logs DELETE RLS 정책 추가
- 설정 페이지 가구 멤버 표시 수정
  - profiles SELECT RLS 정책: 자기만 → 같은 가구 멤버 조회 허용
  - SECURITY DEFINER 함수(get_my_household_id) 사용하여 RLS 재귀 문제 해결

## 알려진 이슈
- Next.js 16 middleware → proxy 경고 (기능 문제 없음)

## 다음 TODO
1. [ ] 추가 UI/UX 개선
