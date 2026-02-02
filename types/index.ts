export type TransactionType = "income" | "expense";
export type ExpenseCategory = "fixed" | "variable" | "irregular";
export type ProfileRole = "OWNER" | "MEMBER";
export type PaymentMethodType = "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "BANK_TRANSFER" | "OTHER";
export type AssetType = "CASH" | "SAVINGS" | "INVESTMENT" | "REAL_ESTATE" | "DEBT" | "CHILD_SAVINGS" | "OTHER";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  household_id: string | null;
  avatar_url?: string | null;
  role: ProfileRole;
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
  payment_method_id: string | null;
  transaction_date: string; // YYYY-MM-DD
  memo: string | null;
  created_at: string;
  last_modified_by: string | null;
  categories?: {
    // Join result
    name: string;
    icon: string;
    color: string;
  };
  payment_methods?: {
    // Join result
    name: string;
    type: PaymentMethodType;
    icon: string | null;
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
  type: AssetType;
  current_amount: number;
  is_liability: boolean;
  owner_type: AssetOwnerType;
  owner_profile_id: string | null;
  child_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  household_id: string;
  name: string;
  type: PaymentMethodType;
  icon: string | null;
  color: string | null;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AssetHistory {
  id: string;
  household_id: string;
  record_date: string; // YYYY-MM-DD
  total_net_worth: number;
  breakdown_data: Record<string, number>; // { "JOINT": 100, "user_id": 50, "CHILD": 10 }
  created_at: string;
}
