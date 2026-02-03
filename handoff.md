# Couple Finance - Handoff

## 현재 상태
- **버전**: v0.3.6
- **빌드 상태**: 성공
- **배포 상태**: 프로덕션 배포 완료
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master
- **최신 커밋**: 545724d

## Supabase 환경
| 환경 | URL | 용도 |
|------|-----|------|
| 개발 | `tsqrohamnjtqocmnokmo.supabase.co` | 로컬 개발/테스트 |
| 운영 | `bgevpihfcvraxososcll.supabase.co` | 프로덕션 |

## Vercel 환경변수 (설정 완료)
- `NEXT_PUBLIC_SUPABASE_URL` - 운영 DB URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 운영 anon key (JWT 형식)

## Supabase 설정 필요
- **Site URL**: https://couple-finance-roan.vercel.app
- **Redirect URLs**: https://couple-finance-roan.vercel.app/**
- **이메일 인증 비활성화**: Authentication → Providers → Email → Confirm email OFF

## 완료된 작업
- [x] Vercel 프로덕션 배포
- [x] 에러 메시지 한글화
- [x] 금액 입력 천단위 콤마 포맷팅
- [x] 키보드 올라올 때 입력 필드 스크롤
- [x] 페이지 전환 애니메이션
- [x] PWA 설치 버튼 동작

## 알려진 이슈
- Next.js 16 middleware → proxy 경고 (기능 문제 없음)

## 다음 TODO
1. [ ] Supabase 이메일 인증 비활성화
2. [ ] 거래 입력 시 결제 수단 선택 UI
3. [ ] 거래 목록에서 결제 수단 표시
