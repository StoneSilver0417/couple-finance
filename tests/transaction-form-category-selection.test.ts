import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  initialCategoryId,
  initialTransactionClassification,
} from "../lib/transaction-category-state.ts";

const src = readFileSync(
  new URL(
    "../app/(app)/transactions/transaction-form-component.tsx",
    import.meta.url,
  ),
  "utf8",
);

describe("single persistent transaction form tree", () => {
  it("renders exactly one form element to prevent unmounting across tab switches", () => {
    const formTags = src.match(/<form\b/g) ?? [];
    assert.equal(formTags.length, 1);
  });

  it("renders exactly one FormFields component outside tab panels", () => {
    const formFieldsTags = src.match(/<FormFields\b/g) ?? [];
    assert.equal(formFieldsTags.length, 1);
  });
});

describe("per-classification category selection and state derivation", () => {
  it("maintains category map across income, fixed, variable, and irregular classifications", () => {
    assert.match(src, /categoryIds/);
    assert.match(src, /income:\s*initialCategoryId\(/);
    assert.match(src, /fixed:\s*initialCategoryId\(/);
    assert.match(src, /variable:\s*initialCategoryId\(/);
    assert.match(src, /irregular:\s*initialCategoryId\(/);
  });

  it("does not clear category with empty string on tab switch", () => {
    assert.doesNotMatch(src, /setCategoryId\(\s*["']["']\s*\)/);
  });

  it("derives active classification and active category selection", () => {
    assert.match(
      src,
      /const activeClassification:\s*TransactionClassification\s*=\s*transactionType === "income"\s*\?\s*"income"\s*:\s*expenseType;/,
    );
    assert.match(src, /categoryIds\[activeClassification\]/);
  });
});

describe("initial category fallback", () => {
  const categories = [
    {
      id: "variable-1",
      type: "expense",
      expense_category: "variable",
    },
    { id: "fixed-1", type: "expense", expense_category: "fixed" },
    { id: "income-1", type: "income", expense_category: null },
  ] as const;

  it("keeps a candidate that belongs to the classification", () => {
    assert.equal(initialCategoryId(categories, "variable", "variable-1"), "variable-1");
  });

  it("falls back for empty, unknown, and mismatched candidates", () => {
    assert.equal(initialCategoryId(categories, "variable", ""), "variable-1");
    assert.equal(initialCategoryId(categories, "variable", "unknown"), "variable-1");
    assert.equal(initialCategoryId(categories, "variable", "fixed-1"), "variable-1");
  });
});

describe("initialData classification and submit contracts", () => {
  it("initializes active classification and category map from initialData", () => {
    assert.equal(initialTransactionClassification({ type: "income" }), "income");
    assert.equal(
      initialTransactionClassification({
        type: "expense",
        expense_type: "fixed",
      }),
      "fixed",
    );
    assert.equal(initialTransactionClassification(), "variable");
    assert.match(src, /initialTransactionClassification\(initialData\)/);
    assert.match(src, /initialData\?\.category_id/);
  });

  it("submits active classification type, expense_type, and mapped category_id", () => {
    assert.match(src, /formData\.set\(["']type["'],\s*transactionType\)/);
    assert.match(src, /formData\.set\(["']expense_type["'],\s*expenseType\)/);
    assert.match(
      src,
      /formData\.set\(["']category_id["'],\s*categoryIds\[activeClassification\]\)/,
    );
  });
});
