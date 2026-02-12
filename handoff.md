# Couple Finance - Handoff

## 현재 상태

- **버전**: v0.6.0 (Security Patch)
- **빌드 상태**: 성공
- **배포 상태**: 프로덕션 배포 완료 (v0.5.5 기준, v0.6.0 마이그레이션 필요)
- **프로덕션 URL**: https://couple-finance-roan.vercel.app
- **관리자 계정**: waterdrop11@naver.com

## Supabase 환경

| 환경 | URL                                | 용도             |
| ---- | ---------------------------------- | ---------------- |
| 개발 | `tsqrohamnjtqocmnokmo.supabase.co` | 로컬 개발/테스트 |
| 운영 | `bgevpihfcvraxososcll.supabase.co` | 프로덕션         |

## 주요 보안 패치 (2026-02-12)

- **SQL RPC 보안**: `create_household_with_owner` 등에서 `auth.uid()` 직접 참조 (인자 조작 방지)
- **암호학적 난수**: `crypto` 모듈을 활용한 안전한 초대 코드 생성
- **IDOR 방어**: 모든 수정/삭제 서버 액션에 가구 소유권(household_id) 재검증 추가

## 최근 작업

- **보안 아키텍처 강화**: 웹 취약점 점검 결과에 따른 대규모 보안 패치 수행

## 알려진 이슈

- Next.js 16 middleware → proxy 경고 (기능 문제 없음)
- **[주의]** 신규 마이그레이션(`20260212000000_security_rpc_fix.sql`)을 실제 Supabase DB에 적용해야 RPC 보안이 활성화됨

## 다음 TODO

1. [ ] Supabase Dashboard에서 신규 SQL 마이그레이션 실행
2. [ ] 보안 패치 이후 전체 기능(가구 생성/참여, 거래 수정/삭제) 정상 동작 테스트
3. [ ] 관리자 페이지 기능 고도화 (통계 등)
