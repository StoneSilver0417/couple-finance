# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.5.5
- **빌드 상태**: 성공
- **배포 상태**: 프로덕션 배포 완료 (GitHub Push 완료)
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master
- **관리자 계정**: waterdrop11@naver.com

## Supabase 환경

| 환경 | URL                                | 용도             |
| ---- | ---------------------------------- | ---------------- |
| 개발 | `tsqrohamnjtqocmnokmo.supabase.co` | 로컬 개발/테스트 |
| 운영 | `bgevpihfcvraxososcll.supabase.co` | 프로덕션         |

## Vercel 환경변수 (설정 완료)

- `NEXT_PUBLIC_SUPABASE_URL` - 운영 DB URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 운영 anon key (JWT 형식)
- `NEXT_PUBLIC_CONTACT_EMAIL` - `waterdrop11@naver.com` (문의 수신용)

## Supabase 설정 (완료)

- **feedbacks 테이블**: 생성됨 (RLS 정책 적용 완료)
- **RLS 정책**: 일반 사용자는 본인 데이터만, `waterdrop11@naver.com`은 모든 데이터 관리 가능
- **기타**: households, profiles, create_household_with_owner 등 기존 설정 유지

## 최근 작업 (2026-02-10)

- **고객 지원 및 관리자 시스템 구축**
  - 설정 페이지에 '고객 지원' 섹션 및 문의하기/내 문의함 모달 추가
  - 관리자 전용 피드백 관리 페이지 (`/admin/feedbacks`) 구현
  - 답변(admin_comment) 작성 및 상태 업데이트 기능 연동
  - 기기 정보 자동 수집 및 시각화 지원
- **UI/UX 개선**
  - shadcn/ui 기반 Badge, ScrollArea, Textarea 컴포넌트 추가
  - 관리자용 프리미엄 관리 도구 디자인 적용

## 알려진 이슈

- Next.js 16 middleware → proxy 경고 (기능 문제 없음)

## 다음 TODO

1. [ ] 추가 UI/UX 개선 및 사용자 피드백 반영
2. [ ] 관리자 페이지 기능 고도화 (통계 등)
