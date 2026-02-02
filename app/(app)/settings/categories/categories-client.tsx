"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryCard } from "./category-card";
import { CategoryDialog } from "./category-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

interface CategoriesClientProps {
  incomeCategories: any[];
  fixedExpenseCategories: any[];
  variableExpenseCategories: any[];
  irregularExpenseCategories: any[];
}

export function CategoriesClient(props: CategoriesClientProps) {
  return (
    <Suspense fallback={null}>
      <CategoriesClientInner {...props} />
    </Suspense>
  );
}

function CategoriesClientInner({
  incomeCategories,
  fixedExpenseCategories,
  variableExpenseCategories,
  irregularExpenseCategories,
}: CategoriesClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"income" | "expense">("expense");
  const [dialogExpenseCategory, setDialogExpenseCategory] = useState<
    "fixed" | "variable" | "irregular"
  >("variable");
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("income");

  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  useEffect(() => {
    if (mode === "add") {
      const type = activeTab === "income" ? "income" : "expense";
      const expenseCat =
        activeTab === "fixed"
          ? "fixed"
          : activeTab === "variable"
            ? "variable"
            : activeTab === "irregular"
              ? "irregular"
              : undefined;

      openCreateDialog(type, expenseCat);

      // Remove query param without refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [mode]);

  function openCreateDialog(
    type: "income" | "expense",
    expenseCategory?: "fixed" | "variable" | "irregular",
  ) {
    setDialogType(type);
    if (expenseCategory) {
      setDialogExpenseCategory(expenseCategory);
    }
    setEditingCategory(null);
    setDialogOpen(true);
  }

  function openEditDialog(category: any) {
    setDialogType(category.type);
    if (category.expense_category) {
      setDialogExpenseCategory(category.expense_category);
    }
    setEditingCategory(category);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-10">
      <div className="sticky top-0 z-20 -mx-6 px-6 py-2 bg-mesh/80 backdrop-blur-md">
        <Tabs
          defaultValue="income"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 w-full p-1 bg-white/40 backdrop-blur-md rounded-[2.5rem] gap-1 border border-white/60 shadow-glass !h-auto">
            <TabsTrigger
              value="income"
              className="flex items-center justify-center gap-1.5 w-full data-[state=active]:bg-white data-[state=active]:shadow-candy data-[state=active]:text-green-600 rounded-full py-2.5 transition-all duration-300"
            >
              <TrendingUp className="h-3.5 w-3.5 shrink-0 text-green-500" />
              <span className="text-[11px] font-bold">수입</span>
            </TabsTrigger>
            <TabsTrigger
              value="fixed"
              className="flex items-center justify-center gap-1.5 w-full data-[state=active]:bg-white data-[state=active]:shadow-candy data-[state=active]:text-blue-600 rounded-full py-2.5 transition-all duration-300"
            >
              <TrendingDown className="h-3.5 w-3.5 shrink-0 text-blue-500" />
              <span className="text-[11px] font-bold">고정</span>
            </TabsTrigger>
            <TabsTrigger
              value="variable"
              className="flex items-center justify-center gap-1.5 w-full data-[state=active]:bg-white data-[state=active]:shadow-candy data-[state=active]:text-primary-dark rounded-full py-2.5 transition-all duration-300"
            >
              <TrendingDown className="h-3.5 w-3.5 shrink-0 text-primary-dark" />
              <span className="text-[11px] font-bold">변동</span>
            </TabsTrigger>
            <TabsTrigger
              value="irregular"
              className="flex items-center justify-center gap-1.5 w-full data-[state=active]:bg-white data-[state=active]:shadow-candy data-[state=active]:text-orange-600 rounded-full py-2.5 transition-all duration-300"
            >
              <TrendingDown className="h-3.5 w-3.5 shrink-0 text-orange-500" />
              <span className="text-[11px] font-bold">비정기</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-8">
            <TabsContent value="income" className="space-y-6 outline-none">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h3 className="text-2xl font-black text-text-main tracking-tighter flex items-center gap-2">
                    수입 카테고리{" "}
                    <span className="text-2xl animate-bounce-subtle">💰</span>
                  </h3>
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1">
                    Manage your income sources
                  </p>
                </div>
                <Button
                  onClick={() => openCreateDialog("income")}
                  size="icon"
                  className="rounded-full h-12 w-12 bg-white hover:bg-white/80 text-primary-dark shadow-soft border border-white/60 transition-all hover:rotate-90"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
              <div className="grid gap-4">
                {incomeCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={openEditDialog}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="fixed" className="space-y-6 outline-none">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h3 className="text-2xl font-black text-text-main tracking-tighter flex items-center gap-2">
                    고정 지출{" "}
                    <span className="text-2xl animate-bounce-subtle">🏠</span>
                  </h3>
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1">
                    Regular monthly bills
                  </p>
                </div>
                <Button
                  onClick={() => openCreateDialog("expense", "fixed")}
                  size="icon"
                  className="rounded-full h-12 w-12 bg-white hover:bg-white/80 text-blue-600 shadow-soft border border-white/60 transition-all hover:rotate-90"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
              <div className="grid gap-4">
                {fixedExpenseCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={openEditDialog}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="variable" className="space-y-6 outline-none">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h3 className="text-2xl font-black text-text-main tracking-tighter flex items-center gap-2">
                    변동 지출{" "}
                    <span className="text-2xl animate-bounce-subtle">🍕</span>
                  </h3>
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1">
                    Daily living expenses
                  </p>
                </div>
                <Button
                  onClick={() => openCreateDialog("expense", "variable")}
                  size="icon"
                  className="rounded-full h-12 w-12 bg-white hover:bg-white/80 text-primary shadow-soft border border-white/60 transition-all hover:rotate-90"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
              <div className="grid gap-4">
                {variableExpenseCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={openEditDialog}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="irregular" className="space-y-6 outline-none">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h3 className="text-2xl font-black text-text-main tracking-tighter flex items-center gap-2">
                    비정기 지출{" "}
                    <span className="text-2xl animate-bounce-subtle">✈️</span>
                  </h3>
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1">
                    Occasional special costs
                  </p>
                </div>
                <Button
                  onClick={() => openCreateDialog("expense", "irregular")}
                  size="icon"
                  className="rounded-full h-12 w-12 bg-white hover:bg-white/80 text-orange-500 shadow-soft border border-white/60 transition-all hover:rotate-90"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
              <div className="grid gap-4">
                {irregularExpenseCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={openEditDialog}
                  />
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
        expenseCategory={dialogExpenseCategory}
        category={editingCategory}
      />
    </div>
  );
}
