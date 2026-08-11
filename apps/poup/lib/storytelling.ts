import { MonthlyStats } from '@/types'
import { formatBRL } from './analytics'

export function generateStory(
  stats: MonthlyStats,
  monthLabel: string,
  prevStats?: MonthlyStats | null
): { headline: string; body: string; tone: 'positive' | 'neutral' | 'warning' } {
  const { totalIncome, totalExpenses, balance, topCategory, transactionCount } = stats

  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0
  const hasIncome = totalIncome > 0

  let headline = ''
  let body = ''
  let tone: 'positive' | 'neutral' | 'warning' = 'neutral'

  // Variação vs mês anterior
  let expenseChange = ''
  if (prevStats && prevStats.totalExpenses > 0) {
    const diff = ((totalExpenses - prevStats.totalExpenses) / prevStats.totalExpenses) * 100
    if (diff > 5) expenseChange = ` — ${Math.abs(diff).toFixed(0)}% a mais que no mês anterior`
    else if (diff < -5) expenseChange = ` — ${Math.abs(diff).toFixed(0)}% a menos que no mês anterior 🎉`
  }

  // Tom baseado no saldo
  if (balance > 0 && savingsRate >= 20) {
    tone = 'positive'
    headline = `Mês excelente! Você poupou ${savingsRate.toFixed(0)}% da sua renda.`
  } else if (balance > 0) {
    tone = 'neutral'
    headline = `Mês equilibrado. Você terminou ${monthLabel} no positivo.`
  } else {
    tone = 'warning'
    headline = `Atenção: os gastos superaram a receita em ${formatBRL(Math.abs(balance))}.`
  }

  // Corpo do texto
  const parts: string[] = []

  parts.push(
    `Em ${monthLabel}, você realizou ${transactionCount} transação${transactionCount !== 1 ? 'ões' : ''} e gastou ${formatBRL(totalExpenses)}${expenseChange}.`
  )

  if (hasIncome) {
    parts.push(`Sua receita total foi de ${formatBRL(totalIncome)}.`)
  }

  if (topCategory && topCategory !== 'N/A') {
    const topCat = stats.categoryBreakdown[0]
    if (topCat) {
      parts.push(
        `Sua maior categoria de gastos foi ${topCategory} — ${formatBRL(topCat.total)} (${topCat.percentage.toFixed(0)}% do total).`
      )
    }
  }

  if (balance >= 0) {
    parts.push(`Você ficou com ${formatBRL(balance)} ao final do mês. ${savingsRate >= 20 ? 'Continue assim! 🚀' : 'Tente aumentar sua reserva no próximo mês.'}`)
  } else {
    parts.push(`Considere revisar os gastos em ${topCategory} para equilibrar as contas. 📌`)
  }

  body = parts.join(' ')

  return { headline, body, tone }
}
