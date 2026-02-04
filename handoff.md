# Couple Finance - Handoff

## 현재 상태
- **버전**: v0.3.8
- **빌드 상태**: 성공
- **배포 상태**: 프로덕션 배포 완료
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master
- **최신 커밋**: 39ae232

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

## 최근 작업 (2026-02-04)
- 예산 실적 분석 페이지 신규 추가
  - `/transactions/[yearMonth]/analysis` 경로
  - 수입/고정지출/변동지출/비정기지출 테이블 표시
  - 항목별 막대 그래프 시각화
  - 지출 비율 프로그레스 바
- 카테고리 추가 버그 수정
  - `is_hidden: false` 명시적 설정
  - 카테고리 변경 시 `/transactions/new` 캐시 갱신 추가

## 알려진 이슈
- Next.js 16 middleware → proxy 경고 (기능 문제 없음)

## 다음 TODO
1. [ ] 거래 입력 시 결제 수단 선택 UI
2. [ ] 거래 목록에서 결제 수단 표시
