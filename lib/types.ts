// =============================================================================
// Money99 - Tipos TypeScript completos
// =============================================================================

// -----------------------------------------------------------------------------
// Tipos base / utilitários
// -----------------------------------------------------------------------------
export type TransactionType = 'receita' | 'despesa' | 'transferencia';
export type AccountType = 'corrente' | 'poupanca' | 'cartao_credito' | 'investimento' | 'dinheiro' | 'outro';
export type CategoryType = 'receita' | 'despesa' | 'ambos';
export type RecurringFrequency = 'diario' | 'semanal' | 'mensal' | 'anual';
export type ThemeType = 'light' | 'dark' | 'system';

// -----------------------------------------------------------------------------
// Profile
// -----------------------------------------------------------------------------
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  theme: ThemeType;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Category
// -----------------------------------------------------------------------------
export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  subcategories?: Subcategory[];
}

// -----------------------------------------------------------------------------
// Subcategory
// -----------------------------------------------------------------------------
export interface Subcategory {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

// -----------------------------------------------------------------------------
// Account
// -----------------------------------------------------------------------------
export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon: string;
  bank_name: string | null;
  last_four_digits: string | null;
  credit_limit: number | null;
  due_day: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Transaction
// -----------------------------------------------------------------------------
export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  destination_account_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  notes: string | null;
  date: string;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  // Joins
  account?: Account;
  destination_account?: Account;
  category?: Category;
  subcategory?: Subcategory;
}

// -----------------------------------------------------------------------------
// Budget
// -----------------------------------------------------------------------------
export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
  // Joins
  category?: Category;
  // Calculados
  spent?: number;
  remaining?: number;
  percentage?: number;
}

// -----------------------------------------------------------------------------
// Goal
// -----------------------------------------------------------------------------
export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  color: string;
  icon: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  // Calculados
  percentage?: number;
  remaining?: number;
}

// -----------------------------------------------------------------------------
// Tipos para formulários (React Hook Form + Zod)
// -----------------------------------------------------------------------------
export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string;
  date: Date;
  category_id?: string;
  subcategory_id?: string;
  account_id?: string;
  destination_account_id?: string;
  is_recurring: boolean;
  recurring_frequency?: RecurringFrequency;
  tags?: string[];
}

export interface AccountFormData {
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon: string;
  bank_name?: string;
  last_four_digits?: string;
  credit_limit?: number;
  due_day?: number;
}

export interface BudgetFormData {
  category_id: string;
  amount: number;
  month: number;
  year: number;
}

export interface GoalFormData {
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: Date;
  color: string;
  icon: string;
}

export interface CategoryFormData {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
}

export interface ProfileFormData {
  full_name: string;
  currency: string;
}

// -----------------------------------------------------------------------------
// Tipos para filtros e queries
// -----------------------------------------------------------------------------
export interface TransactionFilters {
  month?: number;
  year?: number;
  type?: TransactionType | 'all';
  account_id?: string;
  category_id?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// -----------------------------------------------------------------------------
// Tipos para dashboard e relatórios
// -----------------------------------------------------------------------------
export interface DashboardSummary {
  totalBalance: number;
  monthIncome: number;
  monthExpenses: number;
  monthBalance: number;
}

export interface MonthlyEvolution {
  month: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface CategoryExpense {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface MonthlyCategorySummary {
  user_id: string;
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  type: TransactionType;
  month: number;
  year: number;
  total_amount: number;
  transaction_count: number;
}

// -----------------------------------------------------------------------------
// Tipos para Server Actions (retorno padronizado)
// -----------------------------------------------------------------------------
export interface ActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

// -----------------------------------------------------------------------------
// Tipos de conta com labels em português
// -----------------------------------------------------------------------------
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  corrente: 'Conta Corrente',
  poupanca: 'Poupança',
  cartao_credito: 'Cartão de Crédito',
  investimento: 'Investimento',
  dinheiro: 'Dinheiro',
  outro: 'Outro',
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  receita: 'Receita',
  despesa: 'Despesa',
  transferencia: 'Transferência',
};

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  diario: 'Diário',
  semanal: 'Semanal',
  mensal: 'Mensal',
  anual: 'Anual',
};

// Cores padrão para categorias
export const DEFAULT_CATEGORY_COLORS = [
  '#6366f1', '#f97316', '#3b82f6', '#eab308', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#22c55e', '#10b981',
  '#06b6d4', '#84cc16', '#64748b', '#f59e0b', '#dc2626',
];
