import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TransactionForm from "./transaction-form";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: { date?: string } | Promise<{ date?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    redirect("/onboarding");
  }

  // Next 16에서는 searchParams가 Promise일 수 있으므로 안전하게 resolve
  const resolvedParams = await searchParams;
  const initialDate =
    typeof resolvedParams?.date === "string" && resolvedParams.date
      ? resolvedParams.date
      : undefined;

  // Fetch categories
  // 가계부 등록 시에는 숨김 처리된 카테고리는 노출하지 않는다.
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, icon, type, expense_category, is_hidden")
    .eq("household_id", profile.household_id)
    .eq("is_hidden", false)
    .order("display_order", { ascending: true });

  return (
    <TransactionForm
      categories={categories || []}
      initialDate={initialDate}
    />
  );
}
