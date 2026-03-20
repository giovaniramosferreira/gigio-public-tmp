'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  DragStartEvent, DragEndEvent, DragOverEvent, pointerWithin,
} from '@dnd-kit/core'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Tags, Sparkles, Crown, Plus } from 'lucide-react'
import { Transaction } from '@/types'
import { formatBRL, CATEGORY_COLORS } from '@/lib/analytics'
import { DROP_CATEGORIES } from '@/lib/categories'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function formatCardDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const day  = WEEK_DAYS[d.getDay()]
  const dd   = dateStr.slice(8, 10)
  const mm   = dateStr.slice(5, 7)
  const yyyy = dateStr.slice(0, 4)
  return `${day} - ${dd}/${mm}/${yyyy}`
}

/* ─── Draggable card ─── */
function DraggableCard({ transaction, isHidden, isCollapsing }: {
  transaction: Transaction
  isHidden: boolean
  isCollapsing: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: transaction.id })

  return (
    <motion.div
      ref={setNodeRef}
      {...(!isHidden && !isCollapsing ? { ...listeners, ...attributes } : {})}
      data-card-id={transaction.id}
      animate={
        isCollapsing ? { opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } :
        isHidden     ? { opacity: 0 } :
        { opacity: isDragging ? 0.25 : 1 }
      }
      transition={{ duration: isCollapsing ? 0.2 : 0.08 }}
      style={{
        background: '#1e0035',
        border: '1px solid rgba(138,5,190,0.3)',
        borderRadius: 10,
        padding: '10px 16px',
        cursor: !isHidden && !isCollapsing ? 'grab' : 'default',
        userSelect: 'none',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
        <div style={{ fontSize: 12, color: '#6b4d80', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'DM Sans' }}>
          {formatCardDate(transaction.date)}
        </div>
        <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, color: '#f0e6ff', fontFamily: 'DM Sans', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {transaction.description}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#d49dff', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {formatBRL(transaction.amount)}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Drop zone (also clickable as source filter) ─── */
function CategoryZone({ category, isOver, isPulsing, isActive, count, onClick }: {
  category: string; isOver: boolean; isPulsing: boolean
  isActive: boolean; count: number; onClick: () => void
}) {
  const color = CATEGORY_COLORS[category] || '#8A05BE'
  const { setNodeRef } = useDroppable({ id: `zone::${category}` })
  return (
    <motion.div
      ref={setNodeRef}
      data-zone-cat={category}
      onClick={onClick}
      animate={isPulsing
        ? { scale: [1, 1.06, 1.02], borderColor: color, backgroundColor: `${color}30`, boxShadow: [`0 0 0px ${color}00`, `0 0 24px ${color}70`, `0 0 10px ${color}30`] }
        : { scale: isOver ? 1.02 : 1, backgroundColor: isActive ? `${color}18` : isOver ? `${color}20` : 'rgba(255,255,255,0.02)' }}
      transition={isPulsing ? { duration: 0.45, ease: 'easeOut' } : { duration: 0.15 }}
      style={{
        padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
        border: `1.5px ${isActive ? 'solid' : isOver ? 'solid' : 'dashed'} ${isActive ? color : isOver ? color : 'rgba(138,5,190,0.25)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        boxShadow: isActive ? `0 0 12px ${color}33` : 'none',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: isActive || isOver || isPulsing ? '#f0e6ff' : '#c4a8e0', fontFamily: 'DM Sans' }}>
          {category}
        </span>
      </div>
      {count > 0 && (
        <span style={{ fontSize: 11, color: isActive ? color : '#6b4d80', fontFamily: 'DM Sans', fontWeight: isActive ? 700 : 400 }}>
          {count}
        </span>
      )}
    </motion.div>
  )
}

/* ─── Ghost card ─── */
function GhostCard({ transaction }: { transaction: Transaction }) {
  return (
    <div style={{
      background: '#2a0050', border: '1.5px solid rgba(138,5,190,0.7)',
      borderRadius: 10, padding: '10px 16px',
      boxShadow: '0 12px 40px rgba(138,5,190,0.45)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
        <div style={{ fontSize: 12, color: '#9b7db8', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'DM Sans' }}>
          {formatCardDate(transaction.date)}
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#f0e6ff', fontFamily: 'DM Sans', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {transaction.description}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#d49dff', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {formatBRL(transaction.amount)}
        </div>
      </div>
    </div>
  )
}

/* ─── Flying overlay state ─── */
interface FlyingCardState {
  txn: Transaction
  from: { left: number; top: number; width: number }
  to:   { left: number; top: number; width: number }
}

/* ─── Main ─── */
interface Props { transactions: Transaction[]; isPro: boolean; customCategories: string[] }

export default function ReclassifyModal({ transactions, isPro, customCategories: initialCustomCats }: Props) {
  const debits = transactions.filter(t => t.type === 'debit')
  const uniqueCategories = Array.from(new Set(debits.map(t => t.category))).sort()

  const [open, setOpen]                   = useState(false)
  const [sourceCategory, setSourceCategory] = useState('Outros')
  const [removed, setRemoved]             = useState<Set<string>>(new Set())
  const [reclassified, setReclassified]   = useState<Map<string, string>>(new Map())
  const [activeId, setActiveId]           = useState<string | null>(null)
  const [overId, setOverId]               = useState<string | null>(null)

  // Custom categories (from DB via prop)
  const [customCats, setCustomCats]       = useState<string[]>(initialCustomCats)
  const [addingCat, setAddingCat]         = useState(false)
  const [newCatName, setNewCatName]       = useState('')
  const newCatRef                         = useRef<HTMLInputElement>(null)

  useEffect(() => { if (addingCat) newCatRef.current?.focus() }, [addingCat])

  // Animation state
  const [aiRunning, setAiRunning]         = useState(false)
  const [flyingId, setFlyingId]           = useState<string | null>(null)
  const [flyDoneId, setFlyDoneId]         = useState<string | null>(null)
  const [pulsingZone, setPulsingZone]     = useState<string | null>(null)
  const [flyingCard, setFlyingCard]       = useState<FlyingCardState | null>(null)
  const [aiProgress, setAiProgress]       = useState({ done: 0, total: 0 })

  const supabase = createClientComponentClient()
  const router   = useRouter()

  const openModal = () => {
    setRemoved(new Set())
    setReclassified(new Map())
    setAiProgress({ done: 0, total: 0 })
    setSourceCategory(uniqueCategories.includes('Outros') ? 'Outros' : uniqueCategories[0])
    setOpen(true)
  }

  const visible   = debits.filter(t => t.category === sourceCategory && !removed.has(t.id))
  const activeTxn = activeId ? debits.find(t => t.id === activeId) ?? null : null

  // Precompute reclassified counts per category (avoids O(n×categories) per render)
  const reclassifiedCountsMap = new Map<string, number>()
  Array.from(reclassified.values()).forEach(cat => {
    reclassifiedCountsMap.set(cat, (reclassifiedCountsMap.get(cat) ?? 0) + 1)
  })

  const allCategories = [...DROP_CATEGORIES, ...customCats.filter(c => !DROP_CATEGORIES.includes(c))]

  async function addCustomCategory() {
    const name = newCatName.trim()
    if (!name) { setAddingCat(false); setNewCatName(''); return }

    // Validações de segurança
    if (name.length > 50) { toast.error('Nome muito longo (máx. 50 caracteres)'); return }
    if (customCats.length >= 20) { toast.error('Máximo de 20 categorias personalizadas'); return }
    if (allCategories.includes(name)) { setAddingCat(false); setNewCatName(''); return }
    // Apenas letras, números, espaços e traços (evita injeção de strings maliciosas)
    if (!/^[a-zA-ZÀ-ÿ0-9\s\-]+$/.test(name)) {
      toast.error('Nome inválido: use apenas letras, números e espaços')
      return
    }

    const updated = [...customCats, name]
    setCustomCats(updated)
    setNewCatName('')
    setAddingCat(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ custom_categories: updated }).eq('id', user.id)
    toast.success(`Categoria "${name}" criada`)
  }

  async function removeCustomCategory(cat: string) {
    const updated = customCats.filter(c => c !== cat)
    setCustomCats(updated)
    if (sourceCategory === cat) setSourceCategory('Outros')
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ custom_categories: updated }).eq('id', user.id)
  }

  /* ─── Core animation: fly card overlay from card pos → zone pos ─── */
  async function animateCardToZone(txnId: string, txn: Transaction, category: string) {
    const cardEl = document.querySelector(`[data-card-id="${txnId}"]`) as HTMLElement | null
    const zoneEl = document.querySelector(`[data-zone-cat="${category}"]`) as HTMLElement | null

    setFlyingId(txnId)
    setPulsingZone(category)

    if (cardEl && zoneEl) {
      const from = cardEl.getBoundingClientRect()
      const to   = zoneEl.getBoundingClientRect()
      setFlyingCard({
        txn,
        from: { left: from.left, top: from.top, width: from.width },
        to:   {
          left:  to.left,
          top:   to.top + (to.height - from.height) / 2,
          width: to.width,
        },
      })
    }

    // Wait for fly animation (matches transition duration 0.44s)
    await new Promise(r => setTimeout(r, 460))

    setFlyingCard(null)
    setFlyDoneId(txnId)
    setFlyingId(null)
    setPulsingZone(null)

    // Wait for collapse animation
    await new Promise(r => setTimeout(r, 220))

    setRemoved(prev => new Set(Array.from(prev).concat(txnId)))
    setReclassified(prev => new Map(Array.from(prev).concat([[txnId, category]])))
    setFlyDoneId(null)
  }

  /* ─── Manual drag ─── */
  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)
  const handleDragOver  = (e: DragOverEvent) => {
    const newId = (e.over?.id as string) ?? null
    setOverId(prev => prev === newId ? prev : newId)
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null); setOverId(null)
    if (!over) return
    const txnId       = active.id as string
    const newCategory = (over.id as string).replace('zone::', '')
    if (newCategory === sourceCategory) return

    const txn = debits.find(t => t.id === txnId)
    if (!txn) return

    await animateCardToZone(txnId, txn, newCategory)

    const { error } = await supabase.from('transactions')
      .update({ category: newCategory, category_ai: false }).eq('id', txnId)
    if (error) {
      toast.error('Erro ao atualizar categoria')
      // Reverte removed e reclassified
      setRemoved(prev => { const s = new Set(Array.from(prev)); s.delete(txnId); return s })
      setReclassified(prev => { const m = new Map(Array.from(prev)); m.delete(txnId); return m })
    } else {
      toast.success(`Movido para ${newCategory}`)
      router.refresh()
    }
  }

  /* ─── AI reclassification ─── */
  async function handleAIReclassify() {
    const targets = debits.filter(t => t.category === sourceCategory && !removed.has(t.id))
    if (!targets.length) return

    setAiRunning(true)
    setAiProgress({ done: 0, total: targets.length })

    try {
      const res  = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionIds: targets.map(t => t.id) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro desconhecido')

      const results = json.results as { id: string; category: string }[]

      for (const result of results) {
        const txn = debits.find(t => t.id === result.id)
        if (!txn) continue

        await animateCardToZone(result.id, txn, result.category)

        await supabase.from('transactions')
          .update({ category: result.category, category_ai: true })
          .eq('id', result.id)

        setAiProgress(p => ({ ...p, done: p.done + 1 }))
        await new Promise(r => setTimeout(r, 60))
      }

      toast.success(`${results.length} transações reclassificadas!`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setAiRunning(false)
      setFlyingId(null)
      setFlyDoneId(null)
      setPulsingZone(null)
      setFlyingCard(null)
    }
  }

  return (
    <>
      {/* Flying card overlay — fixed position, flies on both axes, outside Dialog portal */}
      <AnimatePresence>
        {flyingCard && (
          <motion.div
            key="flying-card-overlay"
            initial={{
              left: flyingCard.from.left,
              top:  flyingCard.from.top,
              width: flyingCard.from.width,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              left: flyingCard.to.left,
              top:  flyingCard.to.top,
              width: flyingCard.to.width,
              opacity: 0,
              scale: 0.82,
            }}
            transition={{ duration: 0.44, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: 'fixed', zIndex: 9999, pointerEvents: 'none' }}
          >
            <GhostCard transaction={flyingCard.txn} />
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={open} onOpenChange={next => { if (!aiRunning) setOpen(next) }}>
        <button onClick={openModal} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 10, fontSize: 12,
          background: 'rgba(138,5,190,0.12)', border: '1px solid rgba(138,5,190,0.35)',
          color: '#d49dff', fontFamily: 'DM Sans', cursor: 'pointer', fontWeight: 500,
        }}>
          <Tags size={13} /> Reclassificar gastos
        </button>

        <DialogContent className="max-w-[960px] max-h-[92vh] p-7 flex flex-col gap-[18px] bg-[#0e001a] rounded-[20px]">
          <DialogTitle className="sr-only">Reclassificar gastos</DialogTitle>
          <DialogDescription className="sr-only">Arraste os gastos para as categorias corretas ou use a IA para classificar automaticamente.</DialogDescription>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1, minHeight: 0, overflow: 'hidden' }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f0e6ff', fontFamily: 'Sora' }}>
                    Reclassificar gastos
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9b7db8', fontFamily: 'DM Sans' }}>
                    {aiRunning ? 'IA classificando...' : 'Arraste o gasto para a categoria correta'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isPro ? (
                    <motion.button
                      onClick={handleAIReclassify}
                      disabled={aiRunning}
                      whileHover={!aiRunning ? { scale: 1.03 } : {}}
                      whileTap={!aiRunning ? { scale: 0.97 } : {}}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                        background: aiRunning ? 'rgba(138,5,190,0.08)' : 'linear-gradient(135deg, rgba(138,5,190,0.25), rgba(168,62,255,0.2))',
                        border: '1px solid rgba(138,5,190,0.5)',
                        color: aiRunning ? '#6b4d80' : '#d49dff',
                        fontFamily: 'DM Sans', cursor: aiRunning ? 'not-allowed' : 'pointer',
                      }}>
                      <motion.div
                        animate={aiRunning ? { rotate: 360 } : { rotate: 0 }}
                        transition={{ duration: 1.2, repeat: aiRunning ? Infinity : 0, ease: 'linear' }}>
                        <Sparkles size={13} />
                      </motion.div>
                      {aiRunning ? 'Classificando...' : 'Classificar com IA'}
                    </motion.button>
                  ) : (
                    <div title="Disponível apenas no plano Pro" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(138,5,190,0.2)',
                      color: '#4a3060', fontFamily: 'DM Sans', cursor: 'not-allowed',
                    }}>
                      <Crown size={13} style={{ color: '#f59e0b' }} />
                      Classificar com IA
                      <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: 4, padding: '1px 5px' }}>PRO</span>
                    </div>
                  )}
                  <button onClick={() => !aiRunning && setOpen(false)}
                    disabled={aiRunning}
                    aria-label="Fechar"
                    style={{ background: 'none', border: 'none', cursor: aiRunning ? 'not-allowed' : 'pointer', color: '#6b4d80', padding: 4, lineHeight: 1 }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <AnimatePresence>
                {aiRunning && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: '#9b7db8', fontFamily: 'DM Sans' }}>Processando com IA...</span>
                      <span style={{ fontSize: 11, color: '#d49dff', fontFamily: 'DM Sans' }}>{aiProgress.done}/{aiProgress.total}</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: 'rgba(138,5,190,0.15)', overflow: 'hidden' }}>
                      <motion.div
                        animate={{ width: `${aiProgress.total ? (aiProgress.done / aiProgress.total) * 100 : 0}%` }}
                        transition={{ duration: 0.3 }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #8A05BE, #d49dff)', borderRadius: 2 }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* DnD area — 2 columns: cards (wide) | category zones (right) */}
              <DndContext collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 230px', gap: 20, minHeight: 0, flex: 1, overflow: 'hidden' }}>

                  {/* Left: transaction cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'scroll', paddingRight: 20 }}>
                    <div style={{ fontSize: 11, color: '#6b4d80', fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {visible.length} gasto{visible.length !== 1 ? 's' : ''} · {sourceCategory}
                    </div>
                    {visible.length === 0 ? (() => {
                      const hadItems = debits.some(t => t.category === sourceCategory)
                      return (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          style={{ fontSize: 13, fontFamily: 'DM Sans', paddingTop: 12,
                            color: hadItems ? '#4ade80' : '#6b4d80' }}>
                          {hadItems ? '✓ Todos os gastos foram classificados!' : 'Nenhuma transação por aqui'}
                        </motion.div>
                      )
                    })() : (
                      visible.map(t => (
                        <DraggableCard
                          key={t.id}
                          transaction={t}
                          isHidden={flyingId === t.id}
                          isCollapsing={flyDoneId === t.id}
                        />
                      ))
                    )}
                  </div>

                  {/* Right: categories — clickable filter + drop target */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 11, color: '#6b4d80', fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Categorias
                      </span>
                      {!addingCat && (
                        <button
                          onClick={() => setAddingCat(true)}
                          title="Criar categoria personalizada"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b4d80', padding: '0 2px', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontFamily: 'DM Sans' }}>
                          <Plus size={12} /> Nova
                        </button>
                      )}
                    </div>

                    {addingCat && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 }}>
                        <input
                          ref={newCatRef}
                          value={newCatName}
                          onChange={e => setNewCatName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') addCustomCategory(); if (e.key === 'Escape') { setAddingCat(false); setNewCatName('') } }}
                          placeholder="Nome da categoria"
                          style={{
                            background: '#1e0035', border: '1px solid rgba(138,5,190,0.4)',
                            borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#f0e6ff',
                            fontFamily: 'DM Sans', outline: 'none',
                          }}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={addCustomCategory} style={{ flex: 1, background: 'rgba(138,5,190,0.2)', border: '1px solid rgba(138,5,190,0.4)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#d49dff', cursor: 'pointer', fontFamily: 'DM Sans' }}>
                            Criar
                          </button>
                          <button onClick={() => { setAddingCat(false); setNewCatName('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b4d80', padding: '6px 4px' }}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {allCategories.map(cat => {
                      const catCount =
                        debits.filter(t => t.category === cat && !removed.has(t.id)).length +
                        (reclassifiedCountsMap.get(cat) ?? 0)
                      return (
                        <div key={cat} style={{ position: 'relative' }}>
                          <CategoryZone
                            category={cat}
                            isOver={overId === `zone::${cat}`}
                            isPulsing={pulsingZone === cat}
                            isActive={sourceCategory === cat}
                            count={catCount}
                            onClick={() => { if (!aiRunning) { setSourceCategory(cat); setAiProgress({ done: 0, total: 0 }) } }}
                          />
                          {customCats.includes(cat) && (
                            <button
                              onClick={e => { e.stopPropagation(); removeCustomCategory(cat) }}
                              title="Remover categoria"
                              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a3060', padding: 2, lineHeight: 1 }}>
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <DragOverlay dropAnimation={null}>
                  {activeTxn ? <GhostCard transaction={activeTxn} /> : null}
                </DragOverlay>
              </DndContext>
            </div>
          </DialogContent>
        </Dialog>
    </>
  )
}
