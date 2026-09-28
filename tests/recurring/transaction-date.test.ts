import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseTransactionDate } from "../../lib/transaction-date.ts";

describe("parseTransactionDate", () => {
  it("preserves the first day of a month regardless of the process timezone", () => {
    // Given a validated date-only value at a month boundary
    const transactionDate = "2026-03-01";

    // When its calendar components are parsed
    const result = parseTransactionDate(transactionDate);

    // Then no UTC-to-local conversion shifts it into February
    assert.deepEqual(result, { year: 2026, month: 3, day: 1 });
  });

  it("preserves the last day of a year", () => {
    // Given a validated date-only value at a year boundary
    const transactionDate = "2026-12-31";

    // When its calendar components are parsed
    const result = parseTransactionDate(transactionDate);

    // Then each component matches the submitted calendar date
    assert.deepEqual(result, { year: 2026, month: 12, day: 31 });
  });
});
