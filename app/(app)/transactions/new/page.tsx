import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TransactionForm from "./transaction-form";
import { ensureDefaultCategories } from "@/lib/household-actions";

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

  // Fetch categories and payment methods in parallel
  const [categoriesResult, paymentMethodsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, icon, type, expense_category, is_hidden")
      .eq("household_id", profile.household_id)
      .eq("is_hidden", false)
      .order("display_order", { ascending: true }),
    supabase
      .from("payment_methods")
      .select("id, name, type, icon, is_default")
      .eq("household_id", profile.household_id)
      .order("display_order", { ascending: true }),
  ]);

  let categories = categoriesResult.data;
  const paymentMethods = paymentMethodsResult.data || [];

  // 카테고리가 없으면 기본 카테고리 자동 생성
  if (!categories || categories.length === 0) {
    await ensureDefaultCategories();
    // 다시 조회
    const { data: newCategories } = await supabase
      .from("categories")
      .select("id, name, icon, type, expense_category, is_hidden")
      .eq("household_id", profile.household_id)
      .eq("is_hidden", false)
      .order("display_order", { ascending: true });
    categories = newCategories;
  }

  return (
    <TransactionForm
      categories={categories || []}
      paymentMethods={paymentMethods}
      initialDate={initialDate}
    />
  );
}
