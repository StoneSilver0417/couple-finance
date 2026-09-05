import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CategoriesClient } from "./categories-client";
import { ArrowLeft, Info, Sparkles } from "lucide-react";

export default async function CategoriesPage() {
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

  // Fetch all categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("household_id", profile.household_id)
    .order("display_order", { ascending: true });

  const activeCategories = categories?.filter((cat) => !cat.is_hidden) || [];
  const deletedCategories = categories?.filter((cat) => cat.is_hidden) || [];

  const incomeCategories =
    activeCategories.filter((cat) => cat.type === "income");
  const fixedExpenseCategories =
    activeCategories.filter(
      (cat) => cat.type === "expense" && cat.expense_category === "fixed",
    );
  const variableExpenseCategories =
    activeCategories.filter(
      (cat) => cat.type === "expense" && cat.expense_category === "variable",
    );
  const irregularExpenseCategories =
    activeCategories.filter(
      (cat) => cat.type === "expense" && cat.expense_category === "irregular",
    );

  return (
    <div className="flex-1 w-full animate-fade-in pb-8">
      {/* Stitch Header */}
      <header className="flex items-center gap-4 p-6 pt-10">
        <Link href="/settings">
          <Button
            variant="ghost"
            size="icon"
            aria-label="설정으로 돌아가기"
            className="group rounded-full bg-white/60 hover:bg-white shadow-soft transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 text-text-main group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
          </Button>
        </Link>
        <div>
          <p className="text-xs text-text-secondary font-bold tracking-wider uppercase mb-0.5">
            Customization
          </p>
          <h1 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
            카테고리 관리{" "}
            <Sparkles className="h-5 w-5 text-accent-coral animate-pulse" />
          </h1>
        </div>
      </header>

      <div className="px-6 space-y-8">
        <CategoriesClient
          incomeCategories={incomeCategories}
          fixedExpenseCategories={fixedExpenseCategories}
          variableExpenseCategories={variableExpenseCategories}
          irregularExpenseCategories={irregularExpenseCategories}
          deletedCategories={deletedCategories}
        />

        <div className="p-6 rounded-[2rem] bg-white/30 border border-white/40 shadow-sm text-center">
          <p className="text-sm text-text-secondary font-medium">
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span><strong>Tip:</strong> 자주 사용하는 카테고리를 위로 올려보세요!</span>
          </p>
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="h-24" />
    </div>
  );
}
