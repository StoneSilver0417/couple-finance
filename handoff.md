# Couple Finance - Handoff

## 현재 상태
- **버전**: v0.3.3
- **빌드 상태**: 성공 ✅
- **배포 상태**: 프로덕션 배포 완료 ✅
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master
- **최신 커밋**: 00baf79

## Supabase 환경
| 환경 | URL | 용도 |
|------|-----|------|
| 개발 | `tsqrohamnjtqocmnokmo.supabase.co` | 로컬 개발/테스트 |
| 운영 | `bgevpihfcvraxososcll.supabase.co` | 프로덕션 |

## Vercel 환경변수 (설정 완료)
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `SUPABASE_ANON_KEY` ✅

## 최근 작업
- [x] Vercel 프로덕션 배포 완료
- [x] 환경변수 누락 문제 해결 (401 에러 수정)

## 알려진 이슈
- Next.js 16에서 `middleware` → `proxy` 마이그레이션 경고 (기능상 문제 없음)

## 다음 TODO
1. [ ] 거래 입력 시 결제 수단 선택 UI
2. [ ] 거래 목록에서 결제 수단 표시
3. [ ] (선택) middleware → proxy 마이그레이션
