"use client";

import TransactionFormComponent from "@/app/(app)/transactions/transaction-form-component";
import { RecurringClient } from "@/components/settings/recurring/recurring-client";
import type { Category } from "@/types";

const categories: Category[] = [
  {
    id: "category-fixed",
    name: "월세",
    type: "expense",
    expense_category: "fixed",
    icon: "🏠",
    color: "#ff8fab",
    is_custom: true,
    is_hidden: false,
    display_order: 1,
  },
  {
    id: "category-1",
    name: "아주 긴 생활비 카테고리 이름으로 레이아웃 압박 확인",
    type: "expense",
    expense_category: "variable",
    icon: "🏠",
    color: "#ff8fab",
    is_custom: true,
    is_hidden: false,
    display_order: 2,
  },
  {
    id: "category-irregular",
    name: "경조사",
    type: "expense",
    expense_category: "irregular",
    icon: "🎁",
    color: "#ff8fab",
    is_custom: true,
    is_hidden: false,
    display_order: 3,
  },
];

function ignoreSubmit(): Promise<void> {
  return Promise.resolve();
}

export default function UiQaPage() {
  return (
    <main className="min-h-dvh space-y-8 bg-mesh p-4 sm:p-8">
      <section data-qa-surface="transaction-form" className="mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white/80 p-6">
        <TransactionFormComponent
          categories={categories}
          initialData={{
            type: "expense",
            expense_type: "fixed",
            category_id: "category-fixed",
            amount: 1_000_000,
            transaction_date: "2026-09-30",
          }}
          onSubmit={ignoreSubmit}
          isLoading={false}
          submitLabel="수정 완료"
          isEdit
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
            categories: categories[1],
          }]}
          categories={categories}
        />
      </section>

    </main>
  );
}
