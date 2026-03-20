'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { Sparkles, Crown, BookOpen, TrendingUp, Zap, Star, Calendar, Fingerprint } from 'lucide-react'
import { formatBRL } from '@/lib/analytics'
import { Skeleton } from '@/components/ui/skeleton'

// ─── API response types ──────────────────────────────────────────────────────

interface Overview  { totalSpent: number; growth: number; months: number; periodLabel: string }
interface MonthPt   { month: string; label: string; total: number }
interface Chapter   { num: number; name: string; period: string; description: string; topCategory: string; topCategoryColor: string; color: string; avgSpend: number }
interface Peak      { type: string; value: string; numValue: number; date: string; color: string; description: string }
interface CatDrift  { years: string[]; categories: { label: string; color: string; data: number[] }[] }
interface Fingerprint { personality: { title: string; description: string }; traits: { name: string; score: number; color?: string }[] }
interface Seasonal  { name: string; pct: number; isHigh: boolean; isHighest: boolean }

interface HistoriaData {
  overview: Overview
  monthlyChart: MonthPt[]
  chapters: Chapter[]
  peaks: Peak[]
  categoryDrift: CatDrift
  fingerprint: Fingerprint
  seasonal: Seasonal[]
  generatedAt: string
  cached: boolean
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ label, title, sub, children, delay = 0 }: {
  label: string; title: React.ReactNode; sub?: string; children: React.ReactNode; delay?: number
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={{ borderBottom: '1px solid rgba(138,5,190,0.15)', padding: '48px 0' }}
    >
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'DM Sans', fontSize: 10, letterSpacing: '0.22em', color: '#6b4d80', textTransform: 'uppercase', marginBottom: 6 }}>
          {label}
        </div>
        <h2 style={{ fontFamily: 'Sora', fontSize: 22, fontWeight: 700, color: '#f0e6ff', marginBottom: 4 }}>{title}</h2>
        {sub && <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#9b7db8', lineHeight: 1.6 }}>{sub}</p>}
      </div>
      {children}
    </motion.section>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ padding: '48px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles size={20} style={{ color: '#8A05BE' }} />
        </motion.div>
        <span style={{ fontFamily: 'DM Sans', fontSize: 14, color: '#9b7db8' }}>
          Claude está analisando sua história financeira…
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-[240px] w-full mt-4" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12, marginTop: 24 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      </div>
    </div>
  )
}

// ─── Upsell wall (free users) ─────────────────────────────────────────────────

function ProWall() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', gap: 20, textAlign: 'center',
      }}
    >
      <div style={{ width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(138,5,190,0.3), rgba(168,62,255,0.2))', border: '1px solid rgba(138,5,190,0.4)' }}>
        <Crown size={28} style={{ color: '#f59e0b' }} />
      </div>
      <h2 style={{ fontFamily: 'Sora', fontSize: 24, fontWeight: 700, color: '#f0e6ff' }}>
        Sua história financeira
      </h2>
      <p style={{ fontFamily: 'DM Sans', fontSize: 14, color: '#9b7db8', maxWidth: 420, lineHeight: 1.7 }}>
        Descubra os capítulos da sua vida através dos seus gastos. A IA analisa padrões, detecta eras e conta sua trajetória financeira de forma única.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['6 seções interativas', 'Narrativa com IA', 'Impressão digital financeira', 'Gráficos da sua trajetória'].map(f => (
          <span key={f} style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#d49dff', background: 'rgba(138,5,190,0.12)', border: '1px solid rgba(138,5,190,0.25)', borderRadius: 20, padding: '4px 12px' }}>
            {f}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 8, padding: '12px 24px', borderRadius: 12, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', fontFamily: 'Sora', fontSize: 13, fontWeight: 600 }}>
        Disponível no plano Pro — em breve
      </div>
    </motion.div>
  )
}

// ─── Recharts tooltip ─────────────────────────────────────────────────────────

function PoupTooltip({ active, payload, label }: any) {
  if (!active || !payload?.[0]) return null
  return (
    <div style={{ background: '#1e0035', border: '1px solid rgba(138,5,190,0.4)', borderRadius: 10, padding: '10px 14px', fontFamily: 'DM Sans', fontSize: 12, color: '#f0e6ff', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <div style={{ color: '#9b7db8', marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#d49dff', fontWeight: 700 }}>{formatBRL(payload[0].value)}</div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props { isPro: boolean; userName: string | null }

export default function HistoriaClient({ isPro, userName }: Props) {
  const [data, setData]           = useState<HistoriaData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [activeChapter, setActiveChapter] = useState(0)

  useEffect(() => {
    if (!isPro) { setLoading(false); return }
    fetch('/api/historia')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError('Erro ao carregar sua história. Tente novamente.'))
      .finally(() => setLoading(false))
  }, [isPro])

  async function handleRefresh() {
    setRefreshing(true)
    setError(null)
    try {
      const r = await fetch('/api/historia', { method: 'POST' })
      const d = await r.json()
      if (d.error) setError(d.error)
      else setData(d)
    } catch {
      setError('Erro ao atualizar. Tente novamente.')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, width: '100%', margin: '0 auto', overflowX: 'hidden' }}>

      {/* ── Masthead ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 8, paddingBottom: 32, borderBottom: '1px solid rgba(138,5,190,0.15)' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'DM Sans', fontSize: 10, letterSpacing: '0.22em', color: '#6b4d80', textTransform: 'uppercase', marginBottom: 8 }}>
              Autobiografia Financeira
            </div>
            <h1 style={{ fontFamily: 'Sora', fontSize: 32, fontWeight: 700, color: '#f0e6ff', lineHeight: 1.15 }}>
              A <span style={{ color: '#d49dff' }}>história</span> do<br />seu dinheiro
            </h1>
          </div>
          {data && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ textAlign: 'right', fontFamily: 'DM Sans', fontSize: 12, color: '#9b7db8', lineHeight: 1.9 }}>
                <div style={{ color: '#d49dff', fontWeight: 600 }}>{data.overview.periodLabel}</div>
                <div>{data.overview.months} meses de dados</div>
                <div style={{ color: '#6b4d80' }}>
                  {data.cached ? 'Carregado do cache' : 'Gerado agora'} · {new Date(data.generatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <motion.button
                onClick={handleRefresh}
                disabled={refreshing}
                whileHover={!refreshing ? { scale: 1.03 } : {}}
                whileTap={!refreshing ? { scale: 0.97 } : {}}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: refreshing ? 'rgba(138,5,190,0.06)' : 'rgba(138,5,190,0.15)',
                  border: '1px solid rgba(138,5,190,0.35)',
                  color: refreshing ? '#6b4d80' : '#d49dff',
                  fontFamily: 'DM Sans', cursor: refreshing ? 'not-allowed' : 'pointer',
                }}>
                <motion.span
                  animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: 'linear' }}>
                  <Sparkles size={13} />
                </motion.span>
                {refreshing ? 'Atualizando…' : 'Atualizar História'}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── State handling ── */}
      {!isPro && <ProWall />}

      {isPro && loading && <LoadingSkeleton />}

      {isPro && !loading && error && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: '#9b7db8', fontFamily: 'DM Sans' }}>
          <p style={{ marginBottom: 8, color: '#ef4444' }}>{error}</p>
          <button onClick={() => { setError(null); setLoading(true); fetch('/api/historia').then(r => r.json()).then(d => { if (d.error) setError(d.error); else setData(d) }).finally(() => setLoading(false)) }}
            style={{ fontSize: 13, color: '#d49dff', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Tentar novamente
          </button>
        </div>
      )}

      {isPro && data && (
        <AnimatePresence>

          {/* ── I. The Arc (line chart) ── */}
          <Section
            label="I — O Grande Arco"
            title={<>Seus gastos contam uma <span style={{ color: '#d49dff' }}>trajetória</span></>}
            sub="Cada pico e vale nessa linha corresponde a um momento da sua vida."
            delay={0.05}
          >
            <div style={{ display: 'flex', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'Sora', fontSize: 22, fontWeight: 700, color: '#d49dff' }}>
                  {formatBRL(data.overview.totalSpent)}
                </div>
                <div style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#6b4d80' }}>total acumulado</div>
              </div>
              <div>
                <div style={{ fontFamily: 'Sora', fontSize: 22, fontWeight: 700, color: data.overview.growth >= 0 ? '#d49dff' : '#ef4444' }}>
                  {data.overview.growth >= 0 ? '↑' : '↓'} {Math.abs(data.overview.growth)}%
                </div>
                <div style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#6b4d80' }}>crescimento total</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.monthlyChart} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="arcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8A05BE" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8A05BE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(138,5,190,0.08)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6b4d80', fontSize: 10, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false}
                  interval={Math.max(0, Math.floor(data.monthlyChart.length / 8) - 1)} />
                <YAxis tick={{ fill: '#6b4d80', fontSize: 10, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v === 0 ? '' : `R$${(v / 1000).toFixed(0)}k`} width={44} />
                <Tooltip content={<PoupTooltip />} cursor={{ stroke: '#8A05BE', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="total" stroke="#8A05BE" strokeWidth={2} fill="url(#arcGrad)"
                  dot={false} activeDot={{ r: 5, fill: '#d49dff', stroke: '#150025', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          {/* ── II. Life Chapters ── */}
          <Section
            label="II — Capítulos da Vida"
            title={<>A IA detectou <span style={{ color: '#d49dff' }}>{data.chapters.length} eras</span> na sua vida</>}
            sub="Identificadas por mudanças no padrão de gastos — não por datas que você escolheu."
            delay={0.1}
          >
            <div style={{ overflowX: 'auto', marginLeft: -4, marginRight: -4, paddingBottom: 8 }}>
              <div style={{ display: 'flex', gap: 0, minWidth: 'max-content' }}>
                {data.chapters.map((ch, i) => (
                  <button key={ch.num} onClick={() => setActiveChapter(i)}
                    style={{
                      background: activeChapter === i ? '#150025' : 'transparent',
                      border: 'none',
                      borderRight: '1px solid rgba(138,5,190,0.15)',
                      borderTop: activeChapter === i ? `2px solid ${ch.color}` : '2px solid transparent',
                      padding: '24px 28px',
                      minWidth: 210,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ fontFamily: 'DM Sans', fontSize: 10, color: '#6b4d80', letterSpacing: '0.15em', marginBottom: 8 }}>
                      CAP. {String(ch.num).padStart(2, '0')}
                    </div>
                    <div style={{ fontFamily: 'Sora', fontSize: 15, fontWeight: 700, color: '#f0e6ff', lineHeight: 1.3, marginBottom: 4 }}>
                      {ch.name}
                    </div>
                    <div style={{ fontFamily: 'DM Sans', fontSize: 11, color: ch.color, marginBottom: 12 }}>{ch.period}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: ch.topCategoryColor, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'DM Sans', fontSize: 10, color: '#6b4d80', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {ch.topCategory}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {data.chapters[activeChapter] && (
              <motion.div
                key={activeChapter}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{ marginTop: 24, padding: '20px 24px', borderRadius: 16, background: '#150025', border: '1px solid rgba(138,5,190,0.2)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontFamily: 'Sora', fontSize: 15, fontWeight: 700, color: '#f0e6ff' }}>
                    {data.chapters[activeChapter].name}
                  </span>
                  <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#9b7db8' }}>
                    Média {formatBRL(data.chapters[activeChapter].avgSpend)}/mês
                  </span>
                </div>
                <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#c4a8e0', lineHeight: 1.7 }}>
                  {data.chapters[activeChapter].description}
                </p>
              </motion.div>
            )}
          </Section>

          {/* ── III. Category Drift ── */}
          <Section
            label="III — Deriva de Categorias"
            title={<>Como sua <span style={{ color: '#d49dff' }}>identidade</span> de gasto mudou</>}
            sub="As categorias que dominavam seus gastos antes dizem pouco sobre quem você é hoje."
            delay={0.15}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,280px)', gap: 40, alignItems: 'start' }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.categoryDrift.years.map((yr, yi) => {
                  const entry: Record<string, number | string> = { year: yr }
                  for (const cat of data.categoryDrift.categories) entry[cat.label] = cat.data[yi]
                  return entry
                })} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis dataKey="year" tick={{ fill: '#6b4d80', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b4d80', fontSize: 10, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: '#1e0035', border: '1px solid rgba(138,5,190,0.4)', borderRadius: 10, fontFamily: 'DM Sans', fontSize: 12 }}
                    labelStyle={{ color: '#d49dff', marginBottom: 4 }}
                    itemStyle={{ color: '#c4a8e0' }}
                    formatter={(v: number) => [`${v}%`]}
                  />
                  {data.categoryDrift.categories.map(cat => (
                    <Bar key={cat.label} dataKey={cat.label} stackId="a" fill={cat.color} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
              <div style={{ paddingTop: 4 }}>
                {data.categoryDrift.categories.map(cat => {
                  const latest = cat.data[cat.data.length - 1]
                  return (
                    <div key={cat.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: cat.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontFamily: 'DM Sans', fontSize: 13, color: '#9b7db8' }}>{cat.label}</span>
                      <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#6b4d80' }}>{latest}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Section>

          {/* ── IV. Peak Moments ── */}
          <Section
            label="IV — Momentos de Pico"
            title={<>Os <span style={{ color: '#d49dff' }}>outliers</span> que definem sua história</>}
            sub="Gastos que fugiram do padrão — cada um tem uma história por trás."
            delay={0.2}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 1, background: 'rgba(138,5,190,0.12)', border: '1px solid rgba(138,5,190,0.15)', borderRadius: 16, overflow: 'hidden' }}>
              {data.peaks.map((peak, i) => (
                <div key={i} style={{ background: '#0d001a', padding: '22px 22px 22px 26px', position: 'relative', transition: 'background 0.15s', cursor: 'default' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#150025')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#0d001a')}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: peak.color }} />
                  <div style={{ fontFamily: 'DM Sans', fontSize: 9, letterSpacing: '0.2em', color: '#6b4d80', textTransform: 'uppercase', marginBottom: 8 }}>
                    {peak.type}
                  </div>
                  <div style={{ fontFamily: 'Sora', fontSize: 26, fontWeight: 700, color: '#f0e6ff', lineHeight: 1, marginBottom: 6 }}>
                    {peak.value}
                  </div>
                  <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#9b7db8', lineHeight: 1.6, marginBottom: 10 }}>
                    {peak.description}
                  </p>
                  <div style={{ fontFamily: 'DM Sans', fontSize: 10, color: '#6b4d80' }}>{peak.date}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── V. Financial Fingerprint ── */}
          <Section
            label="V — Impressão Digital Financeira"
            title={<>Sua <span style={{ color: '#d49dff' }}>assinatura</span> de gasto</>}
            sub="Nenhuma outra pessoa gasta exatamente igual a você."
            delay={0.25}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
              {/* Traits */}
              <div>
                <div style={{ fontFamily: 'Sora', fontSize: 16, fontWeight: 700, color: '#f0e6ff', marginBottom: 4 }}>
                  {data.fingerprint.personality.title}
                </div>
                <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#9b7db8', lineHeight: 1.7, marginBottom: 24 }}>
                  {data.fingerprint.personality.description}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.fingerprint.traits.map(trait => (
                    <div key={trait.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#9b7db8', width: 180, flexShrink: 0 }}>{trait.name}</span>
                      <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${trait.score}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          style={{ height: '100%', borderRadius: 2, background: trait.color ?? '#8A05BE' }}
                        />
                      </div>
                      <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#6b4d80', width: 28, textAlign: 'right' }}>{trait.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Radar */}
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={data.fingerprint.traits.map(t => ({ trait: t.name.split(' ')[0], score: t.score }))}>
                  <PolarGrid stroke="rgba(138,5,190,0.15)" />
                  <PolarAngleAxis dataKey="trait" tick={{ fill: '#9b7db8', fontSize: 11, fontFamily: 'DM Sans' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="score" stroke="#8A05BE" fill="#8A05BE" fillOpacity={0.2} strokeWidth={2}
                    dot={{ r: 4, fill: '#d49dff', stroke: '#150025', strokeWidth: 2 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Section>

          {/* ── VI. Seasonal Rhythm ── */}
          <Section
            label="VI — Ritmo Sazonal"
            title={<>Você tem um <span style={{ color: '#d49dff' }}>padrão anual</span> previsível</>}
            sub="Média acumulada por mês calendário em todos os anos de dados."
            delay={0.3}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8 }}>
              {data.seasonal.map(mo => (
                <div key={mo.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: '100%', height: 120, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(4, mo.pct * 1.2)}px` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      style={{
                        width: '70%',
                        borderRadius: '3px 3px 0 0',
                        background: mo.isHighest ? 'linear-gradient(180deg, #d49dff, #8A05BE)' :
                                    mo.isHigh    ? 'rgba(138,5,190,0.5)' :
                                                   'rgba(138,5,190,0.15)',
                        border: `1px solid ${mo.isHighest ? '#d49dff' : mo.isHigh ? 'rgba(138,5,190,0.5)' : 'rgba(138,5,190,0.2)'}`,
                        boxShadow: mo.isHighest ? '0 0 16px rgba(212,157,255,0.4)' : 'none',
                      }}
                    />
                  </div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: 9, color: mo.isHighest ? '#d49dff' : '#6b4d80', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {mo.name}
                  </div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: 10, color: mo.isHighest ? '#d49dff' : '#9b7db8' }}>
                    {mo.pct}%
                  </div>
                </div>
              ))}
            </div>
          </Section>

        </AnimatePresence>
      )}
    </div>
  )
}
