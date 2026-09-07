export interface RecurringRule {
  id: string;
  household_id: string;
  user_id: string;
  type: "income" | "expense";
  expense_type: "fixed" | "variable" | "irregular" | null;
  amount: number;
  category_id: string | null;
  memo: string | null;
  target_day: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringOccurrence {
  id: string;
  rule_id: string;
  transaction_id: string;
  target_year: number;
  target_month: number;
  created_at: string;
}
