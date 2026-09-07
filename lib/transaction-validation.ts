import type { ServerSupabaseClient } from "@/lib/supabase/household-context";

export async function categoryBelongsToHousehold(
  supabase: ServerSupabaseClient,
  householdId: string,
  categoryId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("household_id", householdId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

export async function validateCategoryCompatibility(
  supabase: ServerSupabaseClient,
  householdId: string,
  categoryId: string,
  type: "income" | "expense",
  expenseType?: "fixed" | "variable" | "irregular"
): Promise<{ valid: boolean; error?: string }> {
  const { data, error } = await supabase
    .from("categories")
    .select("type, expense_category")
    .eq("id", categoryId)
    .eq("household_id", householdId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { valid: false, error: "카테고리를 찾을 수 없거나 권한이 없습니다." };

  if (data.type !== type) {
    return { valid: false, error: `선택한 카테고리는 ${data.type === "income" ? "수입" : "지출"}용입니다.` };
  }

  if (type === "expense" && data.expense_category !== expenseType) {
    return { valid: false, error: "선택한 카테고리의 지출 유형이 일치하지 않습니다." };
  }

  return { valid: true };
}
