
import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 로그인된 사용자의 가구 ID 가져오기
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!profile.household_id) {
    return NextResponse.json({ error: "No household" }, { status: 400 });
  }

  // 해당 가구의 구형/가짜 보고서 삭제
  const { error: monthlyError } = await supabase
    .from("monthly_reports")
    .delete()
    .eq("household_id", profile.household_id);

  const { error: periodicError } = await supabase
    .from("periodic_reports")
    .delete()
    .eq("household_id", profile.household_id);

  if (monthlyError) {
    return NextResponse.json({ error: monthlyError.message }, { status: 500 });
  }

  if (periodicError) {
    return NextResponse.json({ error: periodicError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
