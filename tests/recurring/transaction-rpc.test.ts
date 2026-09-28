import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createRecurringTransactionRpcArgs,
  enableRecurringTransactionRpcArgs,
} from "../../lib/recurring/transaction-rpc.ts";

const input = {
  householdId: "household-1",
  userId: "user-1",
  type: "income" as const,
  amount: 10000,
  categoryId: "category-1",
  transactionDate: "2026-09-28",
  expenseType: null,
  memo: null,
  targetDay: 28,
  endDate: null,
};

describe("recurring transaction RPC arguments", () => {
  it("maps create arguments to the exact PostgreSQL parameter names", () => {
    assert.deepEqual(createRecurringTransactionRpcArgs(input), {
      p_household_id: "household-1",
      p_user_id: "user-1",
      p_type: "income",
      p_amount: 10000,
      p_category_id: "category-1",
      p_transaction_date: "2026-09-28",
      p_expense_type: null,
      p_memo: null,
      p_target_day: 28,
      p_end_date: null,
    });
  });

  it("adds the existing transaction id when enabling recurrence", () => {
    assert.deepEqual(enableRecurringTransactionRpcArgs("transaction-1", input), {
      p_transaction_id: "transaction-1",
      p_household_id: "household-1",
      p_user_id: "user-1",
      p_type: "income",
      p_amount: 10000,
      p_category_id: "category-1",
      p_transaction_date: "2026-09-28",
      p_expense_type: null,
      p_memo: null,
      p_target_day: 28,
      p_end_date: null,
    });
  });
});
