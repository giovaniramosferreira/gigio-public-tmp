export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calcMonthlyStats, getMonthLabel, MONTH_NAMES } from '@/lib/analytics'
import { generateStory } from '@/lib/storytelling'
import { Transaction } from '@/types'
import StatsCards from '@/components/dashboard/StatsCards'
import StoryCard from '@/components/dashboard/StoryCard'
import CategoryChart from '@/components/dashboard/CategoryChart'
import TransactionList from '@/components/dashboard/TransactionList'
import EmptyState from '@/components/dashboard/EmptyState'
import MonthFilter from '@/components/dashboard/MonthFilter'
import SpendingLineChart from '@/components/dashboard/SpendingLineChart'
import ReclassifyModal from '@/components/dashboard/ReclassifyModal'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string; view?: string }
}) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const view = searchParams.view === 'mes' ? 'mes' : 'fatura'

  // ── Busca perfil e extratos em paralelo ──────────────────────────────────
  const [{ data: profile }, { data: allStatements }] = await Promise.all([
    supabase.from('profiles').select('plan, custom_categories').eq('id', user.id).single(),
    supabase.from('statements').select('id, period_end').eq('user_id', user.id).order('period_end', { ascending: false }),
  ])

  const isPro = profile?.plan === 'pro'
  const customCategories: string[] = profile?.custom_categories ?? []

  // ── Meses disponíveis ────────────────────────────────────────────────────
  let availableMonths: string[]

  if (view === 'fatura') {
    // Agrupa pelo mês do period_end do extrato
    availableMonths = Array.from(new Set(
      (allStatements || [])
        .filter(s => s.period_end)
        .map(s => s.period_end.slice(0, 7))
    )).sort((a, b) => b.localeCompare(a))
  } else {
    // Agrupa por mês calendário — pagina para superar o limite de 1000 linhas do Supabase
    const monthSet = new Set<string>()
    const PAGE = 1000
    let from = 0
    while (true) {
      const { data: page } = await supabase
        .from('transactions')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .range(from, from + PAGE - 1)
      if (!page || page.length === 0) break
      for (const t of page) monthSet.add(t.date.slice(0, 7))
      if (page.length < PAGE) break
      from += PAGE
    }
    availableMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a))
  }

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

  const selectedMonth = searchParams.month && availableMonths.includes(searchParams.month)
    ? searchParams.month
    : availableMonths[0]

  const [year, month] = selectedMonth.split('-').map(Number)

  // ── Busca transações do período selecionado ──────────────────────────────
  let txs:     Transaction[] = []
  let prevTxs: Transaction[] = []

  if (view === 'fatura') {
    // Por statement.period_end
    const prevMonthStr = `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, '0')}`

    const selectedIds = (allStatements || [])
      .filter(s => s.period_end?.slice(0, 7) === selectedMonth)
      .map(s => s.id)

    const prevIds = (allStatements || [])
      .filter(s => s.period_end?.slice(0, 7) === prevMonthStr)
      .map(s => s.id)

    const [r1, r2] = await Promise.all([
      selectedIds.length > 0
        ? supabase.from('transactions').select('*')
            .eq('user_id', user.id)
            .in('statement_id', selectedIds)
            .order('date', { ascending: false })
        : Promise.resolve({ data: [] as any }),
      prevIds.length > 0
        ? supabase.from('transactions').select('*')
            .eq('user_id', user.id)
            .in('statement_id', prevIds)
        : Promise.resolve({ data: [] as any }),
    ])

    txs     = (r1.data || []) as Transaction[]
    prevTxs = (r2.data || []) as Transaction[]
  } else {
    // Por data calendário
    const monthStart   = `${selectedMonth}-01`
    const monthEnd     = new Date(year, month, 0).toISOString().split('T')[0]
    const prevMonthNum = month === 1 ? 12 : month - 1
    const prevYear     = month === 1 ? year - 1 : year
    const prevStart    = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-01`
    const prevEnd      = new Date(prevYear, prevMonthNum, 0).toISOString().split('T')[0]

    const [r1, r2] = await Promise.all([
      supabase.from('transactions').select('*')
        .eq('user_id', user.id)
        .gte('date', monthStart).lte('date', monthEnd)
        .order('date', { ascending: false }),
      supabase.from('transactions').select('*')
        .eq('user_id', user.id)
        .gte('date', prevStart).lte('date', prevEnd),
    ])

    txs     = (r1.data || []) as Transaction[]
    prevTxs = (r2.data || []) as Transaction[]
  }

  const stats      = calcMonthlyStats(txs)
  const prevStats  = prevTxs.length > 0 ? calcMonthlyStats(prevTxs) : null
  const monthLabel = getMonthLabel(`${selectedMonth}-01`)
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
            {' '}<span style={{ opacity: 0.5 }}>· {view === 'fatura' ? 'por fatura' : 'por mês calendário'}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ReclassifyModal transactions={txs} isPro={isPro} customCategories={customCategories} />
          <MonthFilter months={monthOptions} selected={selectedMonth} view={view} />
        </div>
      </div>

      <div className="space-y-6">
        <StatsCards stats={stats} />
        {story && <StoryCard story={story} monthLabel={monthLabel} />}
        <SpendingLineChart transactions={txs} />
        <div className="grid md:grid-cols-2 gap-6">
          <CategoryChart categories={stats.categoryBreakdown} />
          <TransactionList transactions={txs.slice(0, 50)} selectedMonth={selectedMonth} totalCount={txs.length} />
        </div>
      </div>
    </div>
  )
}
