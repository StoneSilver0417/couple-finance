type TransactionType = "income" | "expense";
type ExpenseType = "fixed" | "variable" | "irregular";

export type RecurringTransactionRpcInput = {
  readonly householdId: string;
  readonly userId: string;
  readonly type: TransactionType;
  readonly amount: number;
  readonly categoryId: string;
  readonly transactionDate: string;
  readonly expenseType: ExpenseType | null;
  readonly memo: string | null;
  readonly targetDay: number;
  readonly endDate: string | null;
};

export function createRecurringTransactionRpcArgs(
  input: RecurringTransactionRpcInput,
) {
  return {
    p_household_id: input.householdId,
    p_user_id: input.userId,
    p_type: input.type,
    p_amount: input.amount,
    p_category_id: input.categoryId,
    p_transaction_date: input.transactionDate,
    p_expense_type: input.expenseType,
    p_memo: input.memo,
    p_target_day: input.targetDay,
    p_end_date: input.endDate,
  };
}

export function updateRecurringTransactionRpcArgs(
  transactionId: string,
  input: RecurringTransactionRpcInput,
  recurringEnabled: boolean,
  updateRecurringRule: boolean,
) {
  return {
    p_transaction_id: transactionId,
    ...createRecurringTransactionRpcArgs(input),
    p_recurring_enabled: recurringEnabled,
    p_update_recurring_rule: updateRecurringRule,
  };
}
