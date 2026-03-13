import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Transaction } from '@/types'
import { formatBRL, formatDate, CATEGORY_COLORS } from '@/lib/analytics'
import TransactionFilters from './TransactionFilters'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { month?: string; category?: string }
}) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const selectedMonth = searchParams.month || defaultMonth
  const [year, month] = selectedMonth.split('-').map(Number)
  const monthStart = `${selectedMonth}-01`
  const monthEnd   = new Date(year, month, 0).toISOString().split('T')[0]

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', session.user.id)
    .gte('date', monthStart)
    .lte('date', monthEnd)
    .order('date', { ascending: false })

  if (searchParams.category) {
    query = query.eq('category', searchParams.category)
  }

  const { data: txs } = await query
  const transactions = (txs || []) as Transaction[]

  const totalDebit  = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
  const totalCredit = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)

  // Available months (last 12)
  const months: { value: string; label: string }[] = []
  const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({ value: val, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` })
  }

  const categories = [...new Set(transactions.map(t => t.category))]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
          Transações
        </h1>
        <p className="text-sm mt-1" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
          {transactions.length} transação{transactions.length !== 1 ? 'ões' : ''}
        </p>
      </div>

      {/* Filters */}
      <TransactionFilters
        months={months}
        categories={categories}
        selectedMonth={selectedMonth}
        selectedCategory={searchParams.category}
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Receitas', value: totalCredit, color: '#22c55e' },
          { label: 'Gastos',   value: totalDebit,  color: '#ef4444' },
          { label: 'Saldo',    value: totalCredit - totalDebit, color: totalCredit - totalDebit >= 0 ? '#22c55e' : '#ef4444' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl text-center"
            style={{ background: '#150025', border: '1px solid rgba(138,5,190,0.2)' }}>
            <div className="text-xs mb-1" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>{s.label}</div>
            <div className="text-lg font-bold" style={{ fontFamily: 'Sora', color: s.color }}>
              {formatBRL(s.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#150025', border: '1px solid rgba(138,5,190,0.2)' }}>
        {transactions.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
            Nenhuma transação encontrada para este período.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(138,5,190,0.1)' }}>
            {transactions.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-purple-950/20 transition-colors">
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: CATEGORY_COLORS[t.category] || '#6b7280' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ fontFamily: 'DM Sans', color: '#f0e6ff' }}>
                    {t.description}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                    {formatDate(t.date)}
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full hidden sm:inline-flex"
                  style={{ background: `${CATEGORY_COLORS[t.category]}20`, color: CATEGORY_COLORS[t.category] || '#6b7280', fontFamily: 'DM Sans' }}>
                  {t.category}
                </span>
                <div className="text-sm font-semibold flex-shrink-0"
                  style={{ fontFamily: 'Sora', color: t.type === 'credit' ? '#22c55e' : '#ef4444' }}>
                  {t.type === 'credit' ? '+' : '-'}{formatBRL(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
