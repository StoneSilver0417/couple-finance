"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateBudget(
  categoryId: string,
  year: number,
  month: number,
  amount: number,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    return { error: "가구 정보가 없습니다." };
  }

  try {
    const { error } = await supabase.from("budgets").upsert(
      {
        household_id: profile.household_id,
        category_id: categoryId,
        year,
        month,
        budget_amount: amount,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "household_id, category_id, year, month",
      },
    );

    if (error) throw error;

    revalidatePath("/settings/budgets");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "예산 설정에 실패했습니다." };
  }
}
