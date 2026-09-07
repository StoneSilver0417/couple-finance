import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Repeat } from "lucide-react";
import { RecurringClient } from "@/components/settings/recurring/recurring-client";
import { listRecurringRules } from "@/lib/recurring-actions";

export default async function RecurringTransactionsPage() {
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

  // Fetch recurring rules
  const rulesResult = await listRecurringRules();
  const rules = rulesResult.data || [];

  // Fetch active categories for the dialog
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .eq("household_id", profile.household_id)
    .eq("is_hidden", false)
    .order("display_order", { ascending: true });

  const fetchError = rulesResult.error || (categoriesError ? "카테고리를 불러오지 못했습니다." : undefined);

  return (
    <div className="flex-1 w-full animate-fade-in pb-8">
      <header className="flex items-center gap-4 p-6 pt-10">
        <Link href="/settings">
          <Button
            variant="ghost"
            size="icon"
            aria-label="설정으로 돌아가기"
            className="group size-11 rounded-full bg-white/60 hover:bg-white shadow-soft transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 text-text-main group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
          </Button>
        </Link>
        <div>
          <p className="text-xs text-text-secondary font-bold tracking-wider uppercase mb-0.5">
            Automation
          </p>
          <h1 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
            반복 거래 관리{" "}
            <Repeat className="h-5 w-5 text-primary" aria-hidden="true" />
          </h1>
        </div>
      </header>

      <div className="px-6 space-y-8">
        <RecurringClient rules={rules} categories={categories || []} error={fetchError} />
      </div>

      <div className="h-24" />
    </div>
  );
}
