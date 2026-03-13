export type Plan = 'free' | 'pro'

export interface Profile {
  id: string
  name: string
  phone: string | null
  plan: Plan
  created_at: string
}

export interface Statement {
  id: string
  user_id: string
  filename: string | null
  period_start: string | null
  period_end: string | null
  total_income: number
  total_expenses: number
  uploaded_at: string
}

export interface Transaction {
  id: string
  user_id: string
  statement_id: string | null
  date: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  category: string
  category_ai: boolean
  raw_data: Record<string, unknown> | null
  created_at: string
}

export interface CategorySummary {
  category: string
  total: number
  count: number
  percentage: number
  color: string
}

export interface MonthlyStats {
  totalIncome: number
  totalExpenses: number
  balance: number
  topExpense: Transaction | null
  topCategory: string
  categoryBreakdown: CategorySummary[]
  transactionCount: number
}

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  raw_data: Record<string, unknown>
}
