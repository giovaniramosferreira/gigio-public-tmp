import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calcMonthlyStats, getMonthLabel } from '@/lib/analytics'
import { generateStory } from '@/lib/storytelling'
import { Transaction } from '@/types'
import StatsCards from '@/components/dashboard/StatsCards'
import StoryCard from '@/components/dashboard/StoryCard'
import CategoryChart from '@/components/dashboard/CategoryChart'
import TransactionList from '@/components/dashboard/TransactionList'
import EmptyState from '@/components/dashboard/EmptyState'
import MonthFilter from '@/components/dashboard/MonthFilter'

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string }
}) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  // Buscar todos os meses disponíveis
  const { data: allTxs } = await supabase
    .from('transactions')
    .select('date')
    .eq('user_id', session.user.id)
    .order('date', { ascending: false })

  const availableMonths = [...new Set(
    (allTxs || []).map(t => t.date.slice(0, 7))
  )].sort((a, b) => b.localeCompare(a))

  // Se não há dados, mostra empty state
  if (availableMonths.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
            Dashboard
          </h1>
        </div>
        <EmptyState />
      </div>
    )
  }

  // Mês selecionado: query param > mês mais recente com dados
  const selectedMonth = searchParams.month && availableMonths.includes(searchParams.month)
    ? searchParams.month
    : availableMonths[0]

  const [year, month] = selectedMonth.split('-').map(Number)
  const monthStart = `${selectedMonth}-01`
  const monthEnd   = new Date(year, month, 0).toISOString().split('T')[0]

  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', session.user.id)
    .gte('date', monthStart)
    .lte('date', monthEnd)
    .order('date', { ascending: false })

  // Mês anterior
  const prevMonthNum = month === 1 ? 12 : month - 1
  const prevYear     = month === 1 ? year - 1 : year
  const prevStart    = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-01`
  const prevEnd      = new Date(prevYear, prevMonthNum, 0).toISOString().split('T')[0]

  const { data: prevTxs } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', session.user.id)
    .gte('date', prevStart)
    .lte('date', prevEnd)

  const transactions     = (txs || []) as Transaction[]
  const prevTransactions = (prevTxs || []) as Transaction[]

  const stats      = calcMonthlyStats(transactions)
  const prevStats  = prevTransactions.length > 0 ? calcMonthlyStats(prevTransactions) : null
  const monthLabel = getMonthLabel(monthStart)
  const story      = generateStory(stats, monthLabel, prevStats)

  const monthOptions = availableMonths.map(m => {
    const [y, mo] = m.split('-').map(Number)
    return { value: m, label: `${MONTH_NAMES[mo - 1]} ${y}` }
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
            Visão geral de <strong style={{ color: '#d49dff' }}>{monthLabel}</strong>
          </p>
        </div>
        <MonthFilter months={monthOptions} selected={selectedMonth} />
      </div>

      <div className="space-y-6">
        <StatsCards stats={stats} />
        {story && <StoryCard story={story} monthLabel={monthLabel} />}
        <div className="grid md:grid-cols-2 gap-6">
          <CategoryChart categories={stats.categoryBreakdown} />
          <TransactionList transactions={transactions.slice(0, 15)} />
        </div>
      </div>
    </div>
  )
}
