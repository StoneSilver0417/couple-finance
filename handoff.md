# Couple Finance - Handoff

## 현재 상태
- **버전**: v0.3.2
- **빌드 상태**: 성공 ✅
- **저장소**: https://github.com/StoneSilver0417/couple-finance
- **브랜치**: master
- **최신 커밋**: 31af39e

## Supabase 환경
| 환경 | URL | 용도 |
|------|-----|------|
| 개발 | `tsqrohamnjtqocmnokmo.supabase.co` | 로컬 개발/테스트 |
| 운영 | `bgevpihfcvraxososcll.supabase.co` | 프로덕션 (스키마 적용 완료) |

## 배포 대기 상태
- Vercel CLI 설치 완료
- 운영 DB 스키마 적용 완료
- **다음 단계**: `vercel login` → 환경변수 설정 → 배포

### Vercel 환경변수 (배포 시 설정 필요)
```
NEXT_PUBLIC_SUPABASE_URL=https://bgevpihfcvraxososcll.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_OjsCMvo6Asnt3ES3-2Q1Yg_Tz6ssdY_
```

## 완료된 작업
- [x] PRD v2.0 정합성 (asset_history, payment_methods, role 등)
- [x] Framer Motion 애니메이션
- [x] 카테고리 모달 UI 개선
- [x] 드롭다운 메뉴 투명도 수정
- [x] 모바일 하단 네비게이션 safe-area 적용
- [x] 운영 DB 스키마 적용

## 다음 TODO
1. [ ] Vercel 로그인 및 배포
2. [ ] 거래 입력 시 결제 수단 선택 UI
3. [ ] 거래 목록에서 결제 수단 표시
