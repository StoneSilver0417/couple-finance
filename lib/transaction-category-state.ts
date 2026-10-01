import type { Category } from "@/types";

type ClassifiableCategory = Pick<
  Category,
  "id" | "type" | "expense_category"
>;

export type TransactionClassification =
  | "income"
  | "fixed"
  | "variable"
  | "irregular";

export function initialTransactionClassification(initialData?: {
  readonly type?: "income" | "expense";
  readonly expense_type?: "fixed" | "variable" | "irregular" | null;
}): TransactionClassification {
  if (initialData?.type === "income") return "income";
  return initialData?.expense_type ?? "variable";
}

function categoryMatchesClassification(
  category: ClassifiableCategory,
  classification: TransactionClassification,
) {
  return classification === "income"
    ? category.type === "income"
    : category.type === "expense" &&
        category.expense_category === classification;
}

export function initialCategoryId(
  categories: readonly ClassifiableCategory[],
  classification: TransactionClassification,
  candidateId?: string,
) {
  const candidate = categories.find(
    (category) =>
      category.id === candidateId &&
      categoryMatchesClassification(category, classification),
  );
  return (
    candidate?.id ??
    categories.find((category) =>
      categoryMatchesClassification(category, classification),
    )?.id ??
    ""
  );
}
