import { Transaction, CategorySummary, MonthlyStats } from '@/types'

export const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação':   '#8A05BE',
  'Transporte':    '#a83eff',
  'Streaming':     '#6366f1',
  'Saúde':         '#10b981',
  'Mercado':       '#f59e0b',
  'Receita':       '#22c55e',
  'Moradia':       '#ef4444',
  'Educação':      '#3b82f6',
  'Lazer':         '#ec4899',
  'Financeiro':    '#64748b',
  'Investimentos': '#14b8a6',
  'Outros':        '#6b7280',
}

export function calcMonthlyStats(transactions: Transaction[]): MonthlyStats {
  const debits  = transactions.filter(t => t.type === 'debit')
  const credits = transactions.filter(t => t.type === 'credit')

  const totalExpenses = debits.reduce((s, t) => s + t.amount, 0)
  const totalIncome   = credits.reduce((s, t) => s + t.amount, 0)
  const balance       = totalIncome - totalExpenses

  const topExpense = debits.sort((a, b) => b.amount - a.amount)[0] || null

  // Category breakdown (only debits)
  const catMap: Record<string, { total: number; count: number }> = {}
  for (const t of debits) {
    if (!catMap[t.category]) catMap[t.category] = { total: 0, count: 0 }
    catMap[t.category].total  += t.amount
    catMap[t.category].count  += 1
  }

  const categoryBreakdown: CategorySummary[] = Object.entries(catMap)
    .map(([category, { total, count }]) => ({
      category,
      total,
      count,
      percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
      color: CATEGORY_COLORS[category] || '#6b7280',
    }))
    .sort((a, b) => b.total - a.total)

  const topCategory = categoryBreakdown[0]?.category || 'N/A'

  return {
    totalIncome,
    totalExpenses,
    balance,
    topExpense,
    topCategory,
    categoryBreakdown,
    transactionCount: transactions.length,
  }
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export function getMonthLabel(dateStr: string): string {
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const [year, month] = dateStr.split('-')
  return `${months[parseInt(month) - 1]} ${year}`
}

export function percentChange(current: number, previous: number): number | null {
  if (!previous || previous === 0) return null
  return ((current - previous) / previous) * 100
}
