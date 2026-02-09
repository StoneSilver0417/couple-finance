# Couple Finance - Handoff

## 현재 상태
- **버전**: v0.4.4
- **빌드 상태**: 성공
- **배포 상태**: 프로덕션 배포 완료
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master
- **최신 커밋**: e105f86

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

## 최근 작업 (2026-02-09)
- 자산 포트폴리오 차트 개선
  - Recharts Tooltip/activeShape 제거 → 검은 테두리/네모박스 해결
  - 클릭 시 Total 아래에 한 줄로 자산 정보 표시
  - 퍼센트 즉시 표시 (애니메이션 제거)
  - 레전드 금액 내림차순 정렬
- 자산변동기록 도움말 안내 박스 추가
- 가계부 탭 수입/지출 카드 클릭 시 카테고리별 상세 펼침 기능
  - MonthSummaryCards 클라이언트 컴포넌트 신규
  - 카테고리 클릭 시 CategoryTransactionsModal 연동
- 카테고리 삭제 소프트 삭제로 통합
  - deleteCategory: is_hidden=true (기본/커스텀 모두)
  - restoreCategory: 복원 함수 추가
  - 숨기기 토글 제거, 삭제 버튼 모든 카테고리에 적용
  - 설정 하단에 "삭제된 카테고리" 복원 섹션

## 알려진 이슈
- Next.js 16 middleware → proxy 경고 (기능 문제 없음)

## 다음 TODO
1. [ ] 추가 UI/UX 개선
