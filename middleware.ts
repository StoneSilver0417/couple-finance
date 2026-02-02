import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // 1. 환경 변수 존재 여부 체크 (Vercel Logs에서 확인용)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ 미들웨어 에러: Supabase 환경 변수가 정의되지 않았습니다.");
    // 환경 변수가 없으면 세션 업데이트를 건너뛰고 다음 프로세스로 진행
    return NextResponse.next();
  }

  try {
    return await updateSession(request)
  } catch (error) {
    console.error("❌ 미들웨어 세션 업데이트 실패:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
