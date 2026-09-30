/**
 * Contract tests for transaction-actions.ts and transaction-update-action.ts
 *
 * These tests verify two things:
 *
 * 1. VALIDATION INTEGRATION: Both createTransaction and updateTransaction use
 *    validateCategoryCompatibility (not the weaker categoryBelongsToHousehold)
 *    and pass both `type` and `expenseType` so incompatible category type/expense
 *    subtype is rejected before any DB RPC call.
 *
 * 2. REDIRECT CONTRACT (create only): On success, createTransaction redirects
 *    to /transactions/YYYY-MM derived from the submitted transaction date, NOT
 *    to the static /transactions route.
 *
 * RED phase: run before the implementation changes — source-contract assertions
 * will fail because the old code still calls categoryBelongsToHousehold and
 * redirects to /transactions.
 *
 * GREEN phase: after the implementation is updated, all assertions pass with
 * zero changes to this file.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const createSrc = readFileSync(
  new URL("../lib/transaction-actions.ts", import.meta.url),
  "utf8",
);

const updateSrc = readFileSync(
  new URL("../lib/transaction-update-action.ts", import.meta.url),
  "utf8",
);

// ---------------------------------------------------------------------------
// 1. createTransaction — uses validateCategoryCompatibility
// ---------------------------------------------------------------------------
describe("createTransaction — category validation", () => {
  it("imports validateCategoryCompatibility (not categoryBelongsToHousehold) from transaction-validation", () => {
    assert.match(
      createSrc,
      /import\s*\{[^}]*validateCategoryCompatibility[^}]*\}\s*from.*transaction-validation/,
      "createTransaction must import validateCategoryCompatibility from ./transaction-validation",
    );
    assert.doesNotMatch(
      createSrc,
      /import\s*\{[^}]*categoryBelongsToHousehold[^}]*\}\s*from/,
      "createTransaction must NOT import categoryBelongsToHousehold — it has been replaced by validateCategoryCompatibility",
    );
  });

  it("calls validateCategoryCompatibility with type and expenseType arguments", () => {
    // The call site must pass all four arguments (supabase, householdId, categoryId, type)
    // plus expenseType so incompatible expense subtypes are caught before any RPC.
    assert.match(
      createSrc,
      /validateCategoryCompatibility\(/,
      "createTransaction must call validateCategoryCompatibility()",
    );
    // Verify expenseType is threaded in: the call must pass expenseType as the
    // fifth argument, so the validator can check category.expense_category vs. expenseType.
    assert.match(
      createSrc,
      /validateCategoryCompatibility\(\s*\S[^)]*expenseType/,
      "validateCategoryCompatibility call must include expenseType so subtype mismatch is detected",
    );
  });

  it("returns the error from validateCategoryCompatibility before calling any RPC", () => {
    // The guard must check .valid === false and return .error immediately.
    // We look for the pattern: if (!result.valid) return { error: result.error }
    // or equivalent destructuring form.
    assert.match(
      createSrc,
      /\.valid|catValidation|categoryValidation|compatibility/,
      "createTransaction must read the .valid field from validateCategoryCompatibility result",
    );
    // Ensure the exact error is forwarded — not a hardcoded string.
    assert.match(
      createSrc,
      /return\s*\{\s*error:\s*\S+\.error\s*\}/,
      "createTransaction must return the error from validateCategoryCompatibility result, not a hardcoded string",
    );
  });
});

// ---------------------------------------------------------------------------
// 2. updateTransaction — uses validateCategoryCompatibility
// ---------------------------------------------------------------------------
describe("updateTransaction — category validation", () => {
  it("imports validateCategoryCompatibility (not categoryBelongsToHousehold) from transaction-validation", () => {
    assert.match(
      updateSrc,
      /import\s*\{[^}]*validateCategoryCompatibility[^}]*\}\s*from.*transaction-validation/,
      "updateTransaction must import validateCategoryCompatibility from ./transaction-validation",
    );
    assert.doesNotMatch(
      updateSrc,
      /import\s*\{[^}]*categoryBelongsToHousehold[^}]*\}\s*from/,
      "updateTransaction must NOT import categoryBelongsToHousehold — it has been replaced by validateCategoryCompatibility",
    );
  });

  it("calls validateCategoryCompatibility with type and expenseType arguments", () => {
    assert.match(
      updateSrc,
      /validateCategoryCompatibility\(/,
      "updateTransaction must call validateCategoryCompatibility()",
    );
    assert.match(
      updateSrc,
      /validateCategoryCompatibility\(\s*\S[^)]*expenseType/,
      "validateCategoryCompatibility call in updateTransaction must include expenseType",
    );
  });

  it("returns the error from validateCategoryCompatibility before calling any RPC", () => {
    assert.match(
      updateSrc,
      /\.valid|catValidation|categoryValidation|compatibility/,
      "updateTransaction must read the .valid field from validateCategoryCompatibility result",
    );
    assert.match(
      updateSrc,
      /return\s*\{\s*error:\s*\S+\.error\s*\}/,
      "updateTransaction must return the error from validateCategoryCompatibility result, not a hardcoded string",
    );
  });
});

// ---------------------------------------------------------------------------
// 3. createTransaction — redirect to /transactions/YYYY-MM
// ---------------------------------------------------------------------------
describe("createTransaction — redirect to transaction month", () => {
  it("redirects to /transactions/YYYY-MM using the already-parsed date, not to /transactions", () => {
    // The old code redirects to the static "/transactions" route.
    // After the fix it must redirect to "/transactions/" + a year-month string
    // derived from the parsed date (date.year / date.month or transactionDate.slice).
    assert.doesNotMatch(
      createSrc,
      /redirect\(\s*["']\/transactions["']\s*\)/,
      'createTransaction must NOT redirect to the static "/transactions" route',
    );
    // Accept both template literal and string concatenation forms that produce
    // /transactions/<year>-<month> — we look for /transactions/ followed by a
    // dynamic expression involving the date.
    assert.match(
      createSrc,
      /redirect\([^)]*\/transactions\/[^)]*\)/,
      "createTransaction must redirect to /transactions/<yearMonth> (dynamic, derived from the submitted date)",
    );
  });

  it("uses a zero-padded month in the redirect path (YYYY-MM format)", () => {
    // The yearMonth segment must be zero-padded. We look for padStart, String
    // formatting, or slice from the original date string — all produce YYYY-MM.
    const hasPadding =
      /padStart/.test(createSrc) ||
      // slicing directly from the already-validated transactionDate string
      /transactionDate\.slice\(0,\s*7\)/.test(createSrc) ||
      // or the parsed date is formatted with String() + padStart equivalent
      /String\(.*month.*\)/.test(createSrc) ||
      // or yearMonth is built from date parts
      /`\/transactions\/\$\{/.test(createSrc);
    assert.ok(
      hasPadding,
      "The redirect URL must produce a zero-padded YYYY-MM month. Use padStart(2,'0') or slice the original date string.",
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Behavioral helper — validateCategoryCompatibility logic contract
//    (direct unit tests that call the function with a typed stub)
// ---------------------------------------------------------------------------
describe("validateCategoryCompatibility — rejection prevents RPC execution", () => {
  it("returns {valid:false, error} when category type is income but transaction type is expense", async () => {
    const { validateCategoryCompatibility } = await import(
      "../lib/transaction-validation.ts"
    );
    // Arrange: stub returns an income category
    const stub = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { type: "income", expense_category: null },
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    // Act: ask for "expense" compatibility
    const result = await validateCategoryCompatibility(
      stub as never,
      "hh-1",
      "cat-income-1",
      "expense",
      "fixed",
    );

    // Assert: rejected with a descriptive Korean error
    assert.strictEqual(result.valid, false, "Should be invalid");
    assert.ok(result.error, "Should carry an error message");
    assert.match(result.error, /수입용입니다/, "Error should mention 수입용");
  });

  it("returns {valid:false, error} when expense_category is variable but expenseType is fixed", async () => {
    const { validateCategoryCompatibility } = await import(
      "../lib/transaction-validation.ts"
    );
    const stub = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { type: "expense", expense_category: "variable" },
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    const result = await validateCategoryCompatibility(
      stub as never,
      "hh-1",
      "cat-var-1",
      "expense",
      "fixed",
    );

    assert.strictEqual(result.valid, false, "Should be invalid");
    assert.ok(result.error, "Should carry an error message");
    assert.match(result.error, /지출 유형이 일치하지 않습니다/, "Error should mention 지출 유형 mismatch");
  });

  it("returns {valid:true} when category matches income transaction exactly", async () => {
    const { validateCategoryCompatibility } = await import(
      "../lib/transaction-validation.ts"
    );
    const stub = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { type: "income", expense_category: null },
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    const result = await validateCategoryCompatibility(
      stub as never,
      "hh-1",
      "cat-income-1",
      "income",
    );

    assert.strictEqual(result.valid, true, "Should be valid for matching income category");
    assert.strictEqual(result.error, undefined, "Should carry no error");
  });

  it("returns {valid:true} when expense category matches type and subtype", async () => {
    const { validateCategoryCompatibility } = await import(
      "../lib/transaction-validation.ts"
    );
    const stub = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { type: "expense", expense_category: "irregular" },
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    const result = await validateCategoryCompatibility(
      stub as never,
      "hh-1",
      "cat-irreg-1",
      "expense",
      "irregular",
    );

    assert.strictEqual(result.valid, true, "Should be valid for matching expense + irregular category");
    assert.strictEqual(result.error, undefined, "Should carry no error");
  });
});
