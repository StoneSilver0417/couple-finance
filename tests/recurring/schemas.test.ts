import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dateStringSchema,
  recurringRuleSchema,
} from "../../lib/recurring/schemas.ts";

describe("schemas: dateStringSchema", () => {
  it("accepts valid ISO date strings (YYYY-MM-DD)", () => {
    const result = dateStringSchema.safeParse("2026-03-15");
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data, "2026-03-15");
    }
  });

  it("rejects invalid format", () => {
    const formatFail = dateStringSchema.safeParse("2026/03/15");
    assert.equal(formatFail.success, false);
  });
});

describe("schemas: recurringRuleSchema", () => {
  it("parses valid recurring rules with defaults", () => {
    const input = {
      type: "income",
      amount: 10000,
      category_id: "cat-1",
      target_day: 25,
      start_date: "2026-01-01",
    };
    const result = recurringRuleSchema.safeParse(input);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.type, "income");
      assert.equal(result.data.amount, 10000);
      assert.equal(result.data.target_day, 25);
      assert.equal(result.data.start_date, "2026-01-01");
      assert.equal(result.data.end_date, undefined);
      assert.equal(result.data.is_active, true);
    }
  });

  it("rejects invalid target_day (< 1 or > 31)", () => {
    const low = recurringRuleSchema.safeParse({
      type: "income",
      amount: 10000,
      category_id: "cat-1",
      target_day: 0,
      start_date: "2026-01-01",
    });
    assert.equal(low.success, false);

    const high = recurringRuleSchema.safeParse({
      type: "income",
      amount: 10000,
      category_id: "cat-1",
      target_day: 32,
      start_date: "2026-01-01",
    });
    assert.equal(high.success, false);
  });

  it("rejects end_date prior to start_date", () => {
    const result = recurringRuleSchema.safeParse({
      type: "income",
      amount: 10000,
      category_id: "cat-1",
      target_day: 10,
      start_date: "2026-06-01",
      end_date: "2026-05-31",
    });
    assert.equal(result.success, false);
  });

  it("rejects expense without expense_type", () => {
    const result = recurringRuleSchema.safeParse({
      type: "expense",
      amount: 10000,
      category_id: "cat-1",
      target_day: 10,
      start_date: "2026-06-01",
    });
    assert.equal(result.success, false);
  });
});
