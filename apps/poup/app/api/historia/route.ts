import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { MONTH_NAMES, CATEGORY_COLORS } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TxRow {
  date: string
  amount: number
  type: string
  category: string
  description: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTH_NAMES[m - 1].slice(0, 3)} ${y}`
}

function periodLabel(fromYM: string, toYM: string): string {
  return `${monthLabel(fromYM)} – ${monthLabel(toYM)}`
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v))
}

// ─── Data aggregation (all deterministic — AI only writes narrative) ──────────

function aggregateData(txs: TxRow[]) {
  const debits = txs.filter(t => t.type === 'debit')

  // ── Monthly totals ──────────────────────────────────────────────────────
  const monthlyMap = new Map<string, number>()
  for (const tx of debits) {
    const mo = tx.date.slice(0, 7)
    monthlyMap.set(mo, (monthlyMap.get(mo) ?? 0) + tx.amount)
  }
  const monthlyArr = Array.from(monthlyMap.entries()).sort(([a], [b]) => a.localeCompare(b))
  if (monthlyArr.length === 0) return null

  const totalSpent  = monthlyArr.reduce((s, [, v]) => s + v, 0)
  const avgMonthly  = totalSpent / monthlyArr.length
  const firstMo     = monthlyArr[0][0]
  const lastMo      = monthlyArr[monthlyArr.length - 1][0]

  // ── Category drift by year ─────────────────────────────────────────────
  const catByYear = new Map<string, Map<string, number>>()
  for (const tx of debits) {
    const yr = tx.date.slice(0, 4)
    if (!catByYear.has(yr)) catByYear.set(yr, new Map())
    const ym = catByYear.get(yr)!
    ym.set(tx.category, (ym.get(tx.category) ?? 0) + tx.amount)
  }

  const years = Array.from(catByYear.keys()).sort()
  const allCategories = Array.from(new Set(debits.map(t => t.category)))
    .filter(c => c !== 'Receita' && c !== 'Investimentos')

  const categoryDrift = {
    years,
    categories: allCategories.map(cat => ({
      label: cat,
      color: CATEGORY_COLORS[cat] ?? '#6b7280',
      data: years.map(yr => {
        const ym      = catByYear.get(yr)!
        const yearTotal = Array.from(ym.values()).reduce((a, b) => a + b, 0)
        return yearTotal > 0 ? Math.round(((ym.get(cat) ?? 0) / yearTotal) * 100) : 0
      }),
    })).filter(d => d.data.some(v => v > 0)),
  }

  // ── Peak moments ───────────────────────────────────────────────────────
  const peakMo   = monthlyArr.reduce((max, curr) => curr[1] > max[1] ? curr : max)
  const lowestMo = monthlyArr.reduce((min, curr) => curr[1] < min[1] ? curr : min)

  // Top single transaction
  const topTx = debits.reduce((max, t) => t.amount > max.amount ? t : max, debits[0])

  // Month with most transactions
  const txCountMap = new Map<string, number>()
  for (const tx of debits) {
    const mo = tx.date.slice(0, 7)
    txCountMap.set(mo, (txCountMap.get(mo) ?? 0) + 1)
  }
  const busiest = Array.from(txCountMap.entries()).reduce((max, curr) => curr[1] > max[1] ? curr : max)

  // Fastest month-over-month growth
  let fastestGrowth = { month: '', pct: 0 }
  for (let i = 1; i < monthlyArr.length; i++) {
    const prev = monthlyArr[i - 1][1]
    const curr = monthlyArr[i][1]
    if (prev > 0) {
      const pct = ((curr - prev) / prev) * 100
      if (pct > fastestGrowth.pct) fastestGrowth = { month: monthlyArr[i][0], pct }
    }
  }

  // Longest streak below average
  let streak = 0; let maxStreak = 0
  for (const [, v] of monthlyArr) {
    if (v < avgMonthly) { streak++; maxStreak = Math.max(maxStreak, streak) }
    else streak = 0
  }

  const peaks = [
    {
      type: 'Maior mês de gastos',
      value: `R$ ${(peakMo[1] / 1000).toFixed(1)}k`,
      numValue: peakMo[1],
      date: monthLabel(peakMo[0]),
      pctAboveAvg: Math.round(((peakMo[1] - avgMonthly) / avgMonthly) * 100),
      color: '#8A05BE',
    },
    {
      type: 'Menor mês de gastos',
      value: `R$ ${(lowestMo[1] / 1000).toFixed(1)}k`,
      numValue: lowestMo[1],
      date: monthLabel(lowestMo[0]),
      pctAboveAvg: Math.round(((lowestMo[1] - avgMonthly) / avgMonthly) * 100),
      color: '#6366f1',
    },
    {
      type: 'Maior gasto único',
      value: `R$ ${(topTx.amount / 1000).toFixed(1)}k`,
      numValue: topTx.amount,
      date: topTx.date,
      pctAboveAvg: 0,
      color: '#a83eff',
      description_hint: `${topTx.description} (${topTx.category})`,
    },
    {
      type: 'Mês mais movimentado',
      value: `${busiest[1]} transações`,
      numValue: busiest[1],
      date: monthLabel(busiest[0]),
      pctAboveAvg: 0,
      color: '#ec4899',
    },
    {
      type: 'Crescimento mais rápido',
      value: `+${Math.round(fastestGrowth.pct)}%`,
      numValue: fastestGrowth.pct,
      date: monthLabel(fastestGrowth.month),
      pctAboveAvg: 0,
      color: '#14b8a6',
    },
    {
      type: 'Economia consistente',
      value: `${maxStreak} meses`,
      numValue: maxStreak,
      date: 'abaixo da média',
      pctAboveAvg: 0,
      color: '#22c55e',
    },
  ]

  // ── Seasonal pattern ────────────────────────────────────────────────────
  const seasonalSums   = Array(12).fill(0)
  const seasonalCounts = Array(12).fill(0)
  for (const [mo, total] of monthlyArr) {
    const idx = parseInt(mo.slice(5, 7)) - 1
    seasonalSums[idx]   += total
    seasonalCounts[idx] += 1
  }
  const seasonalAvgs = seasonalSums.map((s, i) => seasonalCounts[i] > 0 ? s / seasonalCounts[i] : 0)
  const seasonalMax  = Math.max(...seasonalAvgs)
  const seasonal = MONTH_NAMES.map((name, i) => ({
    name: name.slice(0, 3),
    pct: seasonalMax > 0 ? Math.round((seasonalAvgs[i] / seasonalMax) * 100) : 0,
    isHigh:    seasonalAvgs[i] >= seasonalMax * 0.85 && seasonalAvgs[i] < seasonalMax,
    isHighest: seasonalAvgs[i] === seasonalMax,
  }))

  // ── Financial fingerprint scores ────────────────────────────────────────
  const stddev = Math.sqrt(
    monthlyArr.reduce((s, [, v]) => s + (v - avgMonthly) ** 2, 0) / monthlyArr.length
  )
  const consistency = clamp(Math.round(100 - (stddev / avgMonthly) * 100))

  const qLen    = Math.max(1, Math.floor(monthlyArr.length / 4))
  const firstQ  = monthlyArr.slice(0, qLen)
  const lastQ   = monthlyArr.slice(-qLen)
  const firstAvg = firstQ.reduce((s, [, v]) => s + v, 0) / firstQ.length
  const lastAvg  = lastQ.reduce((s, [, v]) => s + v, 0) / lastQ.length
  const growth  = clamp(Math.round((lastAvg / Math.max(1, firstAvg)) * 50))

  const hedonicCats    = ['Lazer', 'Streaming', 'Compras online', 'Pets']
  const functionalCats = ['Moradia', 'Saúde', 'Educação', 'Mercado']
  const hedonicTotal   = debits.filter(t => hedonicCats.includes(t.category)).reduce((s, t) => s + t.amount, 0)
  const funcTotal      = debits.filter(t => functionalCats.includes(t.category)).reduce((s, t) => s + t.amount, 0)
  const hedonic        = (hedonicTotal + funcTotal) > 0
    ? clamp(Math.round((hedonicTotal / (hedonicTotal + funcTotal)) * 100)) : 50

  const diversity    = clamp(Math.round((new Set(debits.map(t => t.category)).size / 12) * 100))
  const impulsivity  = clamp(Math.round((monthlyArr.filter(([, v]) => v > avgMonthly * 1.6).length / monthlyArr.length) * 100))
  const seasonality  = seasonalMax > 0
    ? clamp(Math.round(((seasonalMax - Math.min(...seasonalAvgs.filter(v => v > 0))) / seasonalMax) * 100)) : 50

  const merchantMap = new Map<string, number>()
  for (const tx of debits) {
    const key = tx.description.slice(0, 20).toLowerCase()
    merchantMap.set(key, (merchantMap.get(key) ?? 0) + 1)
  }
  const recurring = Array.from(merchantMap.values()).filter(c => c >= 3).length
  const habits    = clamp(Math.round((recurring / Math.max(1, merchantMap.size)) * 100))

  const fingerprint = {
    traits: [
      { name: 'Disciplina mensal',       score: consistency },
      { name: 'Impulsividade',           score: impulsivity,  color: '#ef4444' },
      { name: 'Hedônico vs. funcional',  score: hedonic,      color: '#ec4899' },
      { name: 'Sazonalidade',            score: seasonality },
      { name: 'Diversidade de gastos',   score: diversity,    color: '#3b82f6' },
      { name: 'Tendência de crescimento',score: growth },
      { name: 'Consistência de hábitos', score: habits,       color: '#10b981' },
    ],
  }

  // ── Chapter periods (split data into up to 5 eras) ──────────────────────
  const numChapters = Math.min(5, Math.max(1, Math.floor(monthlyArr.length / 2)))
  const chunkLen    = Math.ceil(monthlyArr.length / numChapters)
  const chapterPeriods = Array.from({ length: numChapters }, (_, i) => {
    const slice   = monthlyArr.slice(i * chunkLen, (i + 1) * chunkLen)
    if (!slice.length) return null
    const fromMo  = slice[0][0]
    const toMo    = slice[slice.length - 1][0]
    const avgSpend = slice.reduce((s, [, v]) => s + v, 0) / slice.length

    // Top category in this period
    const catTotals = new Map<string, number>()
    for (const tx of debits) {
      if (tx.date >= fromMo + '-01' && tx.date <= toMo + '-31') {
        catTotals.set(tx.category, (catTotals.get(tx.category) ?? 0) + tx.amount)
      }
    }
    const topCat = Array.from(catTotals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Outros'

    return { num: i + 1, period: periodLabel(fromMo, toMo), topCategory: topCat, avgSpend, fromMo, toMo }
  }).filter(Boolean) as { num: number; period: string; topCategory: string; avgSpend: number; fromMo: string; toMo: string }[]

  const overallGrowth = firstAvg > 0 ? Math.round(((lastAvg - firstAvg) / firstAvg) * 100) : 0

  return {
    overview: {
      totalSpent,
      growth: overallGrowth,
      months: monthlyArr.length,
      periodLabel: periodLabel(firstMo, lastMo),
    },
    monthlyChart: monthlyArr.map(([mo, total]) => ({
      month: mo,
      label: monthLabel(mo),
      total: Math.round(total),
    })),
    chapterPeriods,
    peaks,
    categoryDrift,
    fingerprint,
    seasonal,
  }
}

// ─── Claude narrative generation ─────────────────────────────────────────────

async function generateNarrative(aggregated: NonNullable<ReturnType<typeof aggregateData>>) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY missing')

  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 30_000 })

  const prompt = `Você é um narrador financeiro brasileiro. Analise esses dados reais de gastos e gere narrativas pessoais e perspicazes em português.

DADOS:
- Período: ${aggregated.overview.periodLabel} (${aggregated.overview.months} meses)
- Total gasto: R$ ${(aggregated.overview.totalSpent / 1000).toFixed(0)}k
- Crescimento: ${aggregated.overview.growth}%
- Média mensal: R$ ${(aggregated.overview.totalSpent / aggregated.overview.months / 1000).toFixed(1)}k

Capítulos detectados (com base em mudanças de padrão):
${aggregated.chapterPeriods.map(c => `- Cap. ${c.num}: ${c.period} | Média R$${(c.avgSpend/1000).toFixed(1)}k/mês | Destaque: ${c.topCategory}`).join('\n')}

Picos notáveis:
${aggregated.peaks.map(p => `- ${p.type}: ${p.value} em ${p.date}${'description_hint' in p ? ` (${(p as any).description_hint})` : ''}`).join('\n')}

Perfil financeiro:
${aggregated.fingerprint.traits.map(t => `- ${t.name}: ${t.score}/100`).join('\n')}

Retorne APENAS JSON válido (sem markdown):
{
  "chapters": [
    {
      "num": 1,
      "name": "Nome evocativo do capítulo (4-6 palavras)",
      "description": "2-3 frases pessoais e perspicazes sobre esse período financeiro. Seja específico aos dados."
    }
  ],
  "peakDescriptions": [
    "Uma frase vívida sobre o maior mês",
    "Uma frase sobre o menor mês",
    "Uma frase sobre o maior gasto único",
    "Uma frase sobre o mês mais movimentado",
    "Uma frase sobre o crescimento mais rápido",
    "Uma frase sobre a economia consistente"
  ],
  "personality": {
    "title": "O [Arquétipo] [Adjetivo] (ex: O Explorador Consciente)",
    "description": "2 frases sobre a personalidade financeira única desse usuário com base nos dados."
  }
}`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}'
  const cleaned = text.replace(/```(?:json)?\s*/gi, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  return JSON.parse(match ? match[0] : cleaned) as {
    chapters: { num: number; name: string; description: string }[]
    peakDescriptions: string[]
    personality: { title: string; description: string }
  }
}

// ─── Shared: busca todos os dados e gera a história via Claude ───────────────

async function buildHistoria(supabase: ReturnType<typeof createRouteHandlerClient>, userId: string) {
  // Pagina todas as transações (Supabase limita 1000 por query)
  const PAGE = 1000
  const allTxs: TxRow[] = []
  let from = 0

  while (true) {
    const { data, error: pageErr } = await supabase
      .from('transactions')
      .select('date, amount, type, category, description')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .range(from, from + PAGE - 1)

    if (pageErr) throw new Error('Erro ao buscar transações')
    if (!data || data.length === 0) break
    allTxs.push(...(data as TxRow[]))
    if (data.length < PAGE) break
    from += PAGE
  }

  const debits = allTxs.filter(t => t.type === 'debit')
  if (debits.length < 10) throw new Error('Dados insuficientes. Importe mais extratos para gerar sua história.')

  const knownCategories = Object.keys(CATEGORY_COLORS)
  const unknownCats = Array.from(new Set(debits.map(t => t.category))).filter(c => !knownCategories.includes(c))
  console.log(`[historia] txs: ${allTxs.length} | débitos: ${debits.length} | período: ${allTxs[0]?.date} → ${allTxs[allTxs.length - 1]?.date}`)
  if (unknownCats.length) console.warn('[historia] categorias sem cor:', unknownCats)

  const aggregated = aggregateData(allTxs)
  if (!aggregated) throw new Error('Sem dados suficientes')

  let narrative
  try {
    narrative = await generateNarrative(aggregated)
  } catch (err) {
    console.error('[historia] narrative generation failed:', err)
    narrative = {
      chapters: aggregated.chapterPeriods.map(c => ({
        num: c.num, name: `Capítulo ${c.num}`, description: `Período de ${c.period} com destaque em ${c.topCategory}.`,
      })),
      peakDescriptions: aggregated.peaks.map(p => `${p.type}: ${p.value} em ${p.date}.`),
      personality: { title: 'O Usuário Poup', description: 'Seus dados contam uma história única.' },
    }
  }

  const CHAPTER_COLORS = ['#8A05BE', '#a83eff', '#6366f1', '#ec4899', '#14b8a6']

  return {
    overview:      aggregated.overview,
    monthlyChart:  aggregated.monthlyChart,
    chapters:      aggregated.chapterPeriods.map((cp, i) => ({
      ...cp,
      name:             narrative.chapters[i]?.name        ?? `Capítulo ${i + 1}`,
      description:      narrative.chapters[i]?.description ?? '',
      topCategoryColor: CATEGORY_COLORS[cp.topCategory]   ?? '#8A05BE',
      color:            CHAPTER_COLORS[i % CHAPTER_COLORS.length],
    })),
    peaks:         aggregated.peaks.map((p, i) => ({ ...p, description: narrative.peakDescriptions[i] ?? '' })),
    categoryDrift: aggregated.categoryDrift,
    fingerprint:   { ...aggregated.fingerprint, personality: narrative.personality },
    seasonal:      aggregated.seasonal,
  }
}

// ─── Auth + Pro guard (reutilizado em GET e POST) ─────────────────────────────

async function authGuard(supabase: ReturnType<typeof createRouteHandlerClient>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) }

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  if (profile?.plan !== 'pro') return { user: null, error: NextResponse.json({ error: 'Disponível apenas no plano Pro' }, { status: 403 }) }

  return { user, error: null }
}

// ─── GET — retorna história cacheada (gera se ainda não existe) ───────────────

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { user, error } = await authGuard(supabase)
  if (!user) return error!

  // Verifica cache
  const { data: cached } = await supabase
    .from('historia')
    .select('data, generated_at')
    .eq('user_id', user.id)
    .single()

  if (cached) {
    return NextResponse.json({ ...cached.data, generatedAt: cached.generated_at, cached: true })
  }

  // Cache miss → gera e salva
  try {
    const data = await buildHistoria(supabase, user.id)
    await supabase.from('historia').upsert({ user_id: user.id, data, generated_at: new Date().toISOString() })
    return NextResponse.json({ ...data, generatedAt: new Date().toISOString(), cached: false })
  } catch (err: any) {
    const isProd = process.env.NODE_ENV === 'production'
    return NextResponse.json({ error: isProd ? 'Erro ao gerar história.' : err.message }, { status: err.message.includes('insuficientes') ? 422 : 500 })
  }
}

// ─── POST — força regeneração (ignora cache) ──────────────────────────────────

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })
  const { user, error } = await authGuard(supabase)
  if (!user) return error!

  try {
    const data = await buildHistoria(supabase, user.id)
    const now  = new Date().toISOString()
    await supabase.from('historia').upsert({ user_id: user.id, data, generated_at: now })
    return NextResponse.json({ ...data, generatedAt: now, cached: false })
  } catch (err: any) {
    const isProd = process.env.NODE_ENV === 'production'
    return NextResponse.json({ error: isProd ? 'Erro ao gerar história.' : err.message }, { status: err.message.includes('insuficientes') ? 422 : 500 })
  }
}
