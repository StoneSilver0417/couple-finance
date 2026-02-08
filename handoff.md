# Couple Finance - Handoff

## 현재 상태
- **버전**: v0.4.2
- **빌드 상태**: 성공
- **배포 상태**: 프로덕션 배포 완료
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master
- **최신 커밋**: c3f3768

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
- 활동기록 전면 수정
  - action_type 한글 표시 (추가/수정/삭제)
  - 1970/1/1 날짜 버그 수정 (created_at 명시적 설정 + 문자열 변환 보장)
  - 금액 포맷 ko-KR 로케일 명시 + Math.round 소수점 제거
  - 거래 수정/예산/카테고리 CRUD 활동기록 로깅 추가
  - formatTimeAgo null/invalid 방어 처리
- 거래내역 모달 레이아웃 재구성
  - overflow-x-hidden 제거, 근본적 레이아웃 수정
  - 금액을 카테고리명 우측에 같은 줄 배치
  - 패딩 축소 (p-6→p-4), 아이템 컴팩트화

## 알려진 이슈
- Next.js 16 middleware → proxy 경고 (기능 문제 없음)
- 기존 활동기록의 잘못된 금액/날짜는 DB에 이미 저장된 상태 (새 기록부터 정상)

## 다음 TODO
1. [ ] 활동기록 실기기 테스트 확인
2. [ ] 추가 UI/UX 개선
