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
