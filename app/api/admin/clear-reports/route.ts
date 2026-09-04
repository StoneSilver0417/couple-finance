
import { NextResponse } from 'next/server';
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 로그인된 사용자의 가구 ID 가져오기
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    return NextResponse.json({ error: "No household" }, { status: 400 });
  }

  // 해당 가구의 구형/가짜 보고서 삭제
  let err1, err2;
  try {
    const res1 = await supabase
      .from("monthly_reports")
      .delete()
      .eq("household_id", profile.household_id);
    err1 = res1.error;
  } catch (e: any) {
    console.error("monthly_reports delete error:", e);
  }

  try {
    const res2 = await supabase
      .from("periodic_reports")
      .delete()
      .eq("household_id", profile.household_id);
    err2 = res2.error;
  } catch (e: any) {
    console.error("periodic_reports delete error:", e);
  }

  if (err1) {
    return NextResponse.json({ error: err1.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
