export type TransactionType = "income" | "expense";
export type ExpenseCategory = "fixed" | "variable" | "irregular";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  household_id: string | null;
  avatar_url?: string | null;
}

export interface Household {
  id: string;
  name: string;
  invite_code: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  expense_category: ExpenseCategory | null;
  icon: string;
  color: string;
  is_custom: boolean;
  is_hidden: boolean;
  display_order: number;
}

export interface Transaction {
  id: string;
  household_id: string;
  user_id: string;
  type: TransactionType;
  expense_type: ExpenseCategory | null;
  amount: number;
  category_id: string;
  transaction_date: string; // YYYY-MM-DD
  memo: string | null;
  created_at: string;
  categories?: {
    // Join result
    name: string;
    icon: string;
    color: string;
  };
}

export interface Budget {
  id: string;
  household_id: string;
  category_id: string;
  year: number;
  month: number;
  budget_amount: number;
  actual_amount: number;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
  carryOver: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
  icon: string;
}

export type AssetOwnerType = "JOINT" | "INDIVIDUAL" | "CHILD";

export interface Asset {
  id: string;
  household_id: string;
  name: string;
  type: string;
  current_amount: number;
  is_liability: boolean;
  owner_type: AssetOwnerType;
  owner_profile_id: string | null;
  child_name: string | null;
  created_at: string;
  updated_at: string;
}
