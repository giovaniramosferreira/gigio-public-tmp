'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Clock, X } from 'lucide-react'
import { Transaction } from '@/types'

// ── Category metadata ────────────────────────────────────────────────────
const CAT: Record<string, { color: string; bg: string; border: string; emoji: string }> = {
  'Alimentação':   { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)',   emoji: '🍔' },
  'Transporte':    { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)',   emoji: '🚗' },
  'Moradia':       { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.25)',   emoji: '🏠' },
  'Saúde':         { color: '#fb7185', bg: 'rgba(251,113,133,0.1)',  border: 'rgba(251,113,133,0.25)',  emoji: '❤️' },
  'Educação':      { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.25)',   emoji: '📚' },
  'Lazer':         { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.25)',  emoji: '🎮' },
  'Streaming':     { color: '#818cf8', bg: 'rgba(129,140,248,0.1)',  border: 'rgba(129,140,248,0.25)',  emoji: '📺' },
  'Mercado':       { color: '#2dd4bf', bg: 'rgba(45,212,191,0.1)',   border: 'rgba(45,212,191,0.25)',   emoji: '🛒' },
  'Receita':       { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)',   emoji: '💰' },
  'Investimentos': { color: '#22d3ee', bg: 'rgba(34,211,238,0.1)',   border: 'rgba(34,211,238,0.25)',   emoji: '📈' },
  'Financeiro':    { color: '#c4b5fd', bg: 'rgba(196,181,253,0.1)', border: 'rgba(196,181,253,0.25)', emoji: '💳' },
  'Outros':        { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.25)', emoji: '❓' },
}

// ── Fireworks ────────────────────────────────────────────────────────────
const FW_COLORS = ['#d49dff','#8A05BE','#60a5fa','#4ade80','#fbbf24','#fb923c','#fb7185','#fff']

function Fireworks() {
  const particles = Array.from({ length: 80 }, (_, i) => {
    const angle = (i / 80) * 2 * Math.PI + Math.random() * 0.4
    const dist  = 100 + Math.random() * 220
    return {
      id: i,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      color: FW_COLORS[i % FW_COLORS.length],
      size: 3 + Math.random() * 5,
      delay: Math.random() * 0.6,
    }
  })

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.tx, y: p.ty, opacity: 0, scale: 0 }}
          transition={{ duration: 1.2 + Math.random() * 0.6, ease: 'easeOut', delay: p.delay }}
          style={{
            position: 'absolute',
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: p.color,
          }}
        />
      ))}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────
interface Result { id: string; description: string; category: string }
interface Props  { targets: Transaction[]; onClose: () => void; onDone: () => void }
type Phase = 'scanning' | 'board' | 'fireworks'

// ── Component ─────────────────────────────────────────────────────────────
export default function AICategorizeModal({ targets, onClose, onDone }: Props) {
  const [phase,      setPhase]      = useState<Phase>('scanning')
  const [scanIdx,    setScanIdx]    = useState(0)
  const [results,    setResults]    = useState<Result[]>([])
  const [dropCount,  setDropCount]  = useState(0) // how many cards have dropped into columns
  const [error,      setError]      = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const minutesSaved = Math.max(1, Math.round((targets.length * 20) / 60))

  // Group results by category (only categories with items)
  const byCategory = results.reduce<Record<string, Result[]>>((acc, r) => {
    ;(acc[r.category] ??= []).push(r)
    return acc
  }, {})
  const columns = Object.keys(byCategory)

  // ── Scan animation ────────────────────────────────────────────────────
  useEffect(() => {
    intervalRef.current = setInterval(() => setScanIdx(i => (i + 1) % targets.length), 100)
    return () => clearInterval(intervalRef.current)
  }, [targets.length])

  // ── API call ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function run() {
      try {
        const res  = await fetch('/api/categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionIds: targets.map(t => t.id) }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Erro desconhecido')

        clearInterval(intervalRef.current)

        const idToDesc = Object.fromEntries(targets.map(t => [t.id, t.description]))
        const categorized: Result[] = (json.results as { id: string; category: string }[]).map(r => ({
          id: r.id,
          description: idToDesc[r.id] ?? r.id,
          category: r.category,
        }))

        setResults(categorized)
        setPhase('board')
      } catch (err: any) {
        clearInterval(intervalRef.current)
        setError(err.message)
      }
    }
    run()
  }, [])

  // ── Drop cards into columns one by one ───────────────────────────────
  useEffect(() => {
    if (phase !== 'board' || !results.length) return
    let i = 0
    const iv = setInterval(() => {
      i++
      setDropCount(i)
      if (i >= results.length) {
        clearInterval(iv)
        setTimeout(() => setPhase('fireworks'), 800)
      }
    }, 80)
    return () => clearInterval(iv)
  }, [phase, results.length])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="relative w-full rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: '#0d001a',
          border: '1px solid rgba(138,5,190,0.3)',
          maxWidth: phase === 'board' ? 900 : 480,
          maxHeight: '90vh',
          transition: 'max-width 0.4s ease',
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(138,5,190,0.15)' }}>
          <div className="flex items-center gap-2">
            <motion.div
              animate={phase === 'scanning' ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 2, repeat: phase === 'scanning' ? Infinity : 0, ease: 'linear' }}>
              <Sparkles size={16} style={{ color: '#d49dff' }} />
            </motion.div>
            <span className="text-sm font-semibold" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
              {phase === 'scanning' && 'IA analisando transações...'}
              {phase === 'board'    && `Classificando ${results.length} transações`}
              {phase === 'fireworks' && 'Categorização concluída!'}
            </span>
          </div>
          {(phase === 'fireworks' || error) && (
            <button onClick={() => { onDone(); onClose() }}
              className="p-1.5 rounded-full"
              style={{ background: 'rgba(138,5,190,0.15)', color: '#9b7db8' }}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── SCANNING ── */}
        {phase === 'scanning' && !error && (
          <div className="flex flex-col items-center gap-6 p-10">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full"
                style={{ background: 'radial-gradient(circle, #8A05BE, transparent)', filter: 'blur(24px)' }}
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-full flex items-center justify-center relative"
                style={{ background: 'rgba(138,5,190,0.18)', border: '1px solid rgba(138,5,190,0.4)' }}>
                <Sparkles size={28} style={{ color: '#d49dff' }} />
              </motion.div>
            </div>

            <div className="text-center">
              <p className="text-lg font-bold mb-1" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
                Analisando {targets.length} transações
              </p>
              <p className="text-sm" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                O Claude está identificando cada categoria...
              </p>
            </div>

            {/* Cycling name */}
            <div className="w-full rounded-2xl px-5 py-3 overflow-hidden"
              style={{ background: 'rgba(138,5,190,0.08)', border: '1px solid rgba(138,5,190,0.2)' }}>
              <AnimatePresence mode="wait">
                <motion.p
                  key={scanIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.08 }}
                  className="text-sm text-center truncate"
                  style={{ fontFamily: 'DM Sans', color: '#d49dff' }}>
                  {targets[scanIdx]?.description}
                </motion.p>
              </AnimatePresence>
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="h-px mt-2"
                style={{ background: 'linear-gradient(90deg, transparent, #8A05BE, transparent)' }}
              />
            </div>

            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.33 }}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#8A05BE' }} />
              ))}
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && (
          <div className="flex flex-col items-center gap-4 p-10 text-center">
            <p className="text-lg font-bold" style={{ fontFamily: 'Sora', color: '#f87171' }}>Erro ao categorizar</p>
            <p className="text-sm" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>{error}</p>
            <button onClick={onClose}
              className="px-6 py-2.5 rounded-full text-sm font-semibold"
              style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', fontFamily: 'DM Sans' }}>
              Fechar
            </button>
          </div>
        )}

        {/* ── BOARD ── */}
        {phase === 'board' && (
          <div className="overflow-x-auto overflow-y-hidden flex-1 p-5">
            <div className="flex gap-3 h-full" style={{ minWidth: columns.length * 180 }}>
              {columns.map(cat => {
                const meta  = CAT[cat] ?? CAT['Outros']
                const cards = byCategory[cat]
                // How many cards of this column have dropped so far
                let cumulative = 0
                for (const c of columns) {
                  if (c === cat) break
                  cumulative += byCategory[c].length
                }
                const visibleInCol = Math.max(0, dropCount - cumulative)

                return (
                  <div key={cat} className="flex flex-col flex-shrink-0" style={{ width: 172 }}>
                    {/* Column header */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2 flex-shrink-0"
                      style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                      <span style={{ fontSize: 14 }}>{meta.emoji}</span>
                      <span className="text-xs font-semibold truncate" style={{ color: meta.color, fontFamily: 'DM Sans' }}>
                        {cat}
                      </span>
                      <span className="ml-auto text-xs font-bold flex-shrink-0"
                        style={{ color: meta.color, fontFamily: 'DM Sans' }}>
                        {cards.length}
                      </span>
                    </motion.div>

                    {/* Cards */}
                    <div className="flex flex-col gap-1.5 overflow-y-auto flex-1"
                      style={{ maxHeight: 340 }}>
                      <AnimatePresence>
                        {cards.slice(0, visibleInCol).map((card, i) => (
                          <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: -30, scale: 0.85 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', damping: 18, stiffness: 300 }}
                            className="px-2.5 py-2 rounded-lg"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: `1px solid ${meta.border}`,
                            }}>
                            <p className="text-xs leading-snug"
                              style={{ fontFamily: 'DM Sans', color: '#e2d9f0', wordBreak: 'break-word' }}>
                              {card.description.length > 40
                                ? card.description.slice(0, 40) + '…'
                                : card.description}
                            </p>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── FIREWORKS ── */}
        {phase === 'fireworks' && (
          <div className="relative flex flex-col items-center gap-6 p-10 overflow-hidden">
            <Fireworks />

            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              style={{ fontSize: 56, lineHeight: 1 }}>
              🎉
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-center">
              <p className="text-2xl font-bold mb-2" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
                Tudo categorizado!
              </p>
              <p className="text-sm" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                {results.length} transações organizadas em {columns.length} categorias
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, type: 'spring' }}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl"
              style={{ background: 'rgba(138,5,190,0.12)', border: '1px solid rgba(138,5,190,0.3)' }}>
              <Clock size={22} style={{ color: '#d49dff', flexShrink: 0 }} />
              <div>
                <p className="text-sm font-semibold" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
                  Você economizou{' '}
                  <span style={{ color: '#d49dff' }}>
                    {minutesSaved} minuto{minutesSaved !== 1 ? 's' : ''}
                  </span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                  ~20 seg por transação classificada manualmente
                </p>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={() => { onDone(); onClose() }}
              className="px-8 py-3 rounded-full text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #8A05BE, #a83eff)', color: '#fff', fontFamily: 'Sora' }}>
              Ver dashboard →
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
