import { test } from "node:test";
import assert from "node:assert";
import { validateCategoryCompatibility } from "../../lib/transaction-validation.ts";
import type { ServerSupabaseClient } from "../../lib/supabase/household-context.ts";

test("validateCategoryCompatibility", async (t) => {
  await t.test("returns valid for matching income category", async () => {
    const mockSupabase = {
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
    } as unknown as ServerSupabaseClient;

    const result = await validateCategoryCompatibility(
      mockSupabase,
      "household-1",
      "cat-1",
      "income"
    );
    assert.strictEqual(result.valid, true);
  });

  await t.test("returns valid for matching expense category", async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { type: "expense", expense_category: "fixed" },
                error: null,
              }),
            }),
          }),
        }),
      }),
    } as unknown as ServerSupabaseClient;

    const result = await validateCategoryCompatibility(
      mockSupabase,
      "household-1",
      "cat-1",
      "expense",
      "fixed"
    );
    assert.strictEqual(result.valid, true);
  });

  await t.test("returns invalid for mismatched type", async () => {
    const mockSupabase = {
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
    } as unknown as ServerSupabaseClient;

    const result = await validateCategoryCompatibility(
      mockSupabase,
      "household-1",
      "cat-1",
      "expense",
      "fixed"
    );
    assert.strictEqual(result.valid, false);
    assert.match(result.error!, /수입용입니다/);
  });

  await t.test("returns invalid for mismatched expense type", async () => {
    const mockSupabase = {
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
    } as unknown as ServerSupabaseClient;

    const result = await validateCategoryCompatibility(
      mockSupabase,
      "household-1",
      "cat-1",
      "expense",
      "fixed"
    );
    assert.strictEqual(result.valid, false);
    assert.match(result.error!, /지출 유형이 일치하지 않습니다/);
  });

  await t.test("returns invalid when category not found", async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      }),
    } as unknown as ServerSupabaseClient;

    const result = await validateCategoryCompatibility(
      mockSupabase,
      "household-1",
      "cat-1",
      "income"
    );
    assert.strictEqual(result.valid, false);
    assert.match(result.error!, /찾을 수 없거나 권한이 없습니다/);
  });
});
