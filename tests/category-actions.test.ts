import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { updateCategorySchema } from "../lib/schemas.ts";

const actionsSrc = readFileSync(
  new URL("../lib/category-actions.ts", import.meta.url),
  "utf8",
);
const migrationPath = new URL(
  "../supabase/migrations/20260929000000_update_category_with_cascade.sql",
  import.meta.url,
);
const dialogSrc = readFileSync(
  new URL("../app/(app)/settings/categories/category-dialog.tsx", import.meta.url),
  "utf8",
);
const clientSrc = readFileSync(
  new URL("../app/(app)/settings/categories/categories-client.tsx", import.meta.url),
  "utf8",
);

describe("updateCategorySchema behavioral validation", () => {
  const validUuid = "123e4567-e89b-12d3-a456-426614174000";

  it("parses valid category payload with expense subtype and trims inputs", () => {
    const parsed = updateCategorySchema.safeParse({
      id: validUuid,
      name: " 식비 ",
      icon: " 🍔 ",
      color: " #FF0000 ",
      expense_category: "variable",
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.name, "식비");
      assert.equal(parsed.data.icon, "🍔");
      assert.equal(parsed.data.color, "#FF0000");
      assert.equal(parsed.data.expense_category, "variable");
    }
  });

  it("allows null or undefined expense_category for income categories", () => {
    const parsedNull = updateCategorySchema.safeParse({
      id: validUuid,
      name: "월급",
      icon: "💰",
      color: "#00FF00",
      expense_category: null,
    });
    assert.equal(parsedNull.success, true);

    const parsedUndefined = updateCategorySchema.safeParse({
      id: validUuid,
      name: "월급",
      icon: "💰",
      color: "#00FF00",
    });
    assert.equal(parsedUndefined.success, true);
  });

  it("rejects invalid id, empty fields, and invalid subtype enum values", () => {
    assert.equal(
      updateCategorySchema.safeParse({
        id: "not-a-uuid",
        name: "식비",
        icon: "🍔",
        color: "#FF0000",
      }).success,
      false,
    );
    assert.equal(
      updateCategorySchema.safeParse({
        id: validUuid,
        name: "   ",
        icon: "🍔",
        color: "#FF0000",
      }).success,
      false,
    );
    assert.equal(
      updateCategorySchema.safeParse({
        id: validUuid,
        name: "식비",
        icon: "🍔",
        color: "#FF0000",
        expense_category: "unsupported",
      }).success,
      false,
    );
  });
});

describe("category actions contract", () => {
  it("validates input via updateCategorySchema and calls atomic cascade RPC", () => {
    assert.match(actionsSrc, /updateCategorySchema\.safeParse/);
    assert.match(actionsSrc, /supabase\.rpc\(["']update_category_with_cascade["']/);
    assert.doesNotMatch(actionsSrc, /\.from\(["']categories["']\)\.update\(/);
  });

  it("revalidates transaction, category, and layout cache paths", () => {
    assert.match(actionsSrc, /revalidatePath\(["']\/settings\/categories["']\)/);
    assert.match(actionsSrc, /revalidatePath\(["']\/transactions["']\)/);
    assert.match(actionsSrc, /revalidatePath\(["']\/["'],\s*["']layout["']\)/);
  });
});

describe("update_category_with_cascade SQL migration contract", () => {
  it("exists as a security definer function with auth and household checks", () => {
    assert.ok(existsSync(migrationPath));
    const sql = readFileSync(migrationPath, "utf8");
    assert.match(sql, /CREATE\s+FUNCTION\s+update_category_with_cascade/i);
    assert.match(sql, /SECURITY\s+DEFINER/i);
    assert.match(sql, /auth\.uid\(\)\s+IS\s+NULL/i);
    assert.match(sql, /FROM\s+profiles\s+WHERE\s+id\s*=\s*auth\.uid\(\)\s+AND\s+household_id\s*=\s*p_household_id/i);
    assert.match(sql, /FOR\s+UPDATE/i);
  });

  it("enforces non-null expense subtype and validates subtype values", () => {
    const sql = readFileSync(migrationPath, "utf8");
    assert.match(sql, /v_category_type\s*=\s*'expense'\s+AND\s+p_expense_category\s+IS\s+NULL/i);
    assert.match(sql, /p_expense_category\s+NOT\s+IN\s*\('fixed',\s*'variable',\s*'irregular'\)/i);
    assert.match(sql, /p_expense_category\s+IS\s+NOT\s+NULL\s+AND\s+v_category_type\s*<>\s*'expense'/i);
  });

  it("atomically cascades to categories, transactions, and recurring_rules with authenticated execute grant", () => {
    const sql = readFileSync(migrationPath, "utf8");
    assert.match(sql, /UPDATE\s+categories\s+SET/i);
    assert.match(sql, /UPDATE\s+transactions\s+SET\s+expense_type\s*=\s*p_expense_category/i);
    assert.match(sql, /UPDATE\s+recurring_rules\s+SET\s+expense_type\s*=\s*p_expense_category/i);
    assert.match(sql, /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+update_category_with_cascade.*FROM\s+PUBLIC/i);
    assert.match(sql, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+update_category_with_cascade.*TO\s+authenticated/i);
  });
});

describe("category dialog subtype submission and error preservation", () => {
  it("manages selectedExpenseCategory state and renders subtype options", () => {
    assert.match(dialogSrc, /selectedExpenseCategory/);
    assert.match(dialogSrc, /fixed[\s\S]*variable[\s\S]*irregular/);
  });

  it("submits subtype via formData and notifies parent via onSaved callback", () => {
    assert.match(dialogSrc, /formData\.set\(["']expense_category["'],\s*selectedExpenseCategory\)/);
    assert.match(dialogSrc, /onSaved\?:\s*\(type:\s*["']income["']\s*\|\s*["']expense["']/);
    assert.match(dialogSrc, /onSaved\(type,\s*selectedExpenseCategory\)/);
  });

  it("preserves open dialog and values on submission failure", () => {
    assert.match(dialogSrc, /if\s*\(result\?\.error\)\s*\{\s*toast\.error\(result\.error\);\s*setIsLoading\(false\);/);
  });
});

describe("categories client native history tab persistence", () => {
  it("initializes and validates active tab from search params", () => {
    assert.match(clientSrc, /searchParams\.get\(["']tab["']\)/);
    assert.match(clientSrc, /initialTab === "income" \|\| initialTab === "fixed" \|\| initialTab === "variable" \|\| initialTab === "irregular"/);
  });

  it("persists tab via native history API and preserves tab on mode cleanup", () => {
    assert.match(clientSrc, /window\.history\.replaceState\(null,\s*["']["'],\s*`\$\{pathname\}\?\$\{newParams\.toString\(\)\}`\)/);
    assert.match(clientSrc, /newParams\.set\(["']tab["'],\s*activeTab\)/);
  });

  it("switches active tab when onSaved fires", () => {
    assert.match(clientSrc, /onSaved=\{\(type,\s*expenseCategory\)\s*=>\s*\{[\s\S]*handleTabChange/);
  });
});
