"use client";

import TransactionFormComponent from "@/app/(app)/transactions/transaction-form-component";
import { RecurringClient } from "@/components/settings/recurring/recurring-client";
import type { Category } from "@/types";

const categories: Category[] = [
  {
    id: "category-1",
    name: "아주 긴 생활비 카테고리 이름으로 레이아웃 압박 확인",
    type: "expense",
    expense_category: "variable",
    icon: "🏠",
    color: "#ff8fab",
    is_custom: true,
    is_hidden: false,
    display_order: 1,
  },
  {
    id: "category-2",
    name: "두 번째 변동 지출 카테고리",
    type: "expense",
    expense_category: "variable",
    icon: "🛒",
    color: "#ffc2d1",
    is_custom: true,
    is_hidden: false,
    display_order: 2,
  },
  {
    id: "category-fixed",
    name: "고정 지출 카테고리",
    type: "expense",
    expense_category: "fixed",
    icon: "🏦",
    color: "#ffc2d1",
    is_custom: true,
    is_hidden: false,
    display_order: 1,
  },
  {
    id: "category-irregular",
    name: "비정기 지출 카테고리",
    type: "expense",
    expense_category: "irregular",
    icon: "📦",
    color: "#e0c3fc",
    is_custom: true,
    is_hidden: false,
    display_order: 1,
  },
  {
    id: "category-income",
    name: "수입 카테고리",
    type: "income",
    expense_category: null,
    icon: "💰",
    color: "#ff8fab",
    is_custom: true,
    is_hidden: false,
    display_order: 1,
  },
];

export default function UiQaPage() {
  return (
    <main className="min-h-dvh space-y-8 bg-mesh p-4 sm:p-8">
      <section data-qa-surface="transaction-form" className="mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white/80 p-6">
        <TransactionFormComponent
          categories={categories}
          initialData={{
            type: "expense",
            expense_type: "variable",
            category_id: "",
          }}
          onSubmit={async () => undefined}
          isLoading={false}
          submitLabel="추가하기"
        />
      </section>

      <section data-qa-surface="recurring-settings" className="mx-auto w-full max-w-md">
        <RecurringClient
          rules={[{
            id: "rule-1",
            household_id: "household-1",
            user_id: "user-1",
            type: "expense",
            expense_type: "variable",
            amount: 123456789,
            category_id: "category-1",
            memo: "길이가 긴 반복 거래 메모가 카드 영역을 밀어내지 않는지 확인합니다",
            target_day: 31,
            start_date: "2026-09-01",
            end_date: null,
            is_active: true,
            created_at: "2026-09-01",
            updated_at: "2026-09-01",
            categories: categories[0],
          }]}
          categories={categories}
        />
      </section>

    </main>
  );
}
