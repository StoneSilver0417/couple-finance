"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CategoryCard } from "./category-card";
import { CategoryDialog } from "./category-dialog";
import { DeletedCategoryList } from "./deleted-category-list";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingDown, TrendingUp, Trash2, ChevronDown } from "lucide-react";
import type { Category, ExpenseCategory } from "@/types";

interface CategoriesClientProps {
  incomeCategories: Category[];
  fixedExpenseCategories: Category[];
  variableExpenseCategories: Category[];
  irregularExpenseCategories: Category[];
  deletedCategories: Category[];
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
  deletedCategories,
}: CategoriesClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"income" | "expense">("expense");
  const [dialogExpenseCategory, setDialogExpenseCategory] = useState<
    "fixed" | "variable" | "irregular"
  >("variable");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState("income");
  const [showDeleted, setShowDeleted] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const mode = searchParams.get("mode");

  const openCreateDialog = useCallback(
    (type: "income" | "expense", expenseCategory?: ExpenseCategory) => {
      setDialogType(type);
      if (expenseCategory) {
        setDialogExpenseCategory(expenseCategory);
      }
      setEditingCategory(null);
      setDialogOpen(true);
    },
    [],
  );

  // ?mode=add 딥링크 처리: 이전 렌더의 mode와 비교해 진입 시점에만
  // 렌더 중 상태 조정으로 다이얼로그를 연다 (effect 내 setState 회피)
  // 초기값을 null로 두어 첫 렌더(딥링크 직접 진입)에서도 처리되도록 한다
  const [prevMode, setPrevMode] = useState<string | null>(null);
  if (mode !== prevMode) {
    setPrevMode(mode);
    if (mode === "add") {
      const type = activeTab === "income" ? "income" : "expense";
      const expenseCat: ExpenseCategory | undefined =
        activeTab === "fixed" ||
        activeTab === "variable" ||
        activeTab === "irregular"
          ? activeTab
          : undefined;
      openCreateDialog(type, expenseCat);
    }
  }

  // URL 정리는 부수효과이므로 effect에서 수행.
  // history.replaceState는 Next 라우터의 searchParams를 갱신하지 않으므로 router.replace 사용
  useEffect(() => {
    if (mode === "add") {
      router.replace(pathname, { scroll: false });
    }
  }, [mode, router, pathname]);

  function openEditDialog(category: Category) {
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

      {/* 삭제된 카테고리 복원 섹션 */}
      {deletedCategories.length > 0 && (
        <div>
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gray-50/80 border border-gray-200/60 hover:bg-gray-100/80 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-text-secondary">
              <Trash2 className="h-4 w-4" />
              삭제된 카테고리 ({deletedCategories.length})
            </span>
            <ChevronDown
              className={`h-4 w-4 text-text-secondary transition-transform duration-200 ${
                showDeleted ? "rotate-180" : ""
              }`}
            />
          </button>

          {showDeleted && (
            <div className="mt-3">
              <DeletedCategoryList categories={deletedCategories} />
            </div>
          )}
        </div>
      )}

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
