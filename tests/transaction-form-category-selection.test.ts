import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const transactionFormComponent = readFileSync(
  new URL(
    "../app/(app)/transactions/transaction-form-component.tsx",
    import.meta.url,
  ),
  "utf8",
);

describe("transaction form category selection", () => {
  it("clears the selected category when the transaction classification changes", () => {
    assert.match(
      transactionFormComponent,
      /function handleTransactionTypeChange[^}]*setCategoryId\(""\)/,
    );
    assert.match(
      transactionFormComponent,
      /function handleExpenseTypeChange[^}]*setCategoryId\(""\)/,
    );
  });

  it("passes the controlled category selection to both transaction forms", () => {
    assert.equal(
      transactionFormComponent.match(/categoryId=\{categoryId\}/g)?.length,
      2,
    );
    assert.equal(
      transactionFormComponent.match(/onCategoryChange=\{setCategoryId\}/g)?.length,
      2,
    );
  });
});
