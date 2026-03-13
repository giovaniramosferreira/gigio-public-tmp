'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  DragStartEvent, DragEndEvent, pointerWithin,
} from '@dnd-kit/core'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Tags } from 'lucide-react'
import { Transaction } from '@/types'
import { formatBRL, CATEGORY_COLORS } from '@/lib/analytics'

const DROP_CATEGORIES = [
  'Alimentação', 'Educação', 'Financeiro', 'Lazer',
  'Mercado', 'Moradia', 'Outros', 'Saúde', 'Streaming', 'Transporte',
]

/* ─── Draggable card ─── */
function DraggableCard({ transaction }: { transaction: Transaction }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: transaction.id })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        opacity: isDragging ? 0.25 : 1,
        background: '#1e0035',
        border: '1px solid rgba(138,5,190,0.3)',
        borderRadius: 12,
        padding: '10px 12px',
        cursor: 'grab',
        userSelect: 'none',
        transition: 'opacity 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#f0e6ff', fontFamily: 'DM Sans', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {transaction.description}
          </div>
          <div style={{ fontSize: 11, color: '#9b7db8', marginTop: 2 }}>
            {transaction.date.slice(8, 10)}/{transaction.date.slice(5, 7)}
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#d49dff', flexShrink: 0 }}>
          {formatBRL(transaction.amount)}
        </div>
      </div>
    </div>
  )
}

/* ─── Drop zone ─── */
function CategoryZone({ category, isOver }: { category: string; isOver: boolean }) {
  const color = CATEGORY_COLORS[category] || '#8A05BE'
  const { setNodeRef } = useDroppable({ id: `zone::${category}` })
  return (
    <div
      ref={setNodeRef}
      style={{
        padding: '10px 14px',
        borderRadius: 12,
        border: `1.5px ${isOver ? 'solid' : 'dashed'} ${isOver ? color : 'rgba(138,5,190,0.25)'}`,
        background: isOver ? `${color}20` : 'rgba(255,255,255,0.02)',
        transition: 'all 0.15s',
        transform: isOver ? 'scale(1.02)' : 'scale(1)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: isOver ? '#f0e6ff' : '#c4a8e0', fontFamily: 'DM Sans' }}>
        {category}
      </span>
    </div>
  )
}

/* ─── Ghost card shown while dragging ─── */
function GhostCard({ transaction }: { transaction: Transaction }) {
  return (
    <div style={{
      background: '#2a0050',
      border: '1.5px solid rgba(138,5,190,0.7)',
      borderRadius: 12,
      padding: '10px 12px',
      boxShadow: '0 12px 40px rgba(138,5,190,0.35)',
      cursor: 'grabbing',
      minWidth: 220,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#f0e6ff', fontFamily: 'DM Sans', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {transaction.description}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#d49dff', flexShrink: 0 }}>
          {formatBRL(transaction.amount)}
        </div>
      </div>
    </div>
  )
}

/* ─── Main component ─── */
interface Props { transactions: Transaction[] }

export default function ReclassifyModal({ transactions }: Props) {
  const debits = transactions.filter(t => t.type === 'debit')
  const uniqueCategories = Array.from(new Set(debits.map(t => t.category))).sort()

  const [open, setOpen] = useState(false)
  const [sourceCategory, setSourceCategory] = useState('Outros')
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const router = useRouter()

  const openModal = () => {
    setRemoved(new Set())
    setSourceCategory(uniqueCategories.includes('Outros') ? 'Outros' : uniqueCategories[0])
    setOpen(true)
  }

  const visible = debits.filter(t => t.category === sourceCategory && !removed.has(t.id))
  const activeTxn = activeId ? debits.find(t => t.id === activeId) ?? null : null

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)
  const handleDragOver  = (e: any) => setOverId(e.over?.id ?? null)

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    setOverId(null)
    if (!over) return

    const txnId = active.id as string
    const newCategory = (over.id as string).replace('zone::', '')
    if (newCategory === sourceCategory) return

    // Optimistic: hide card immediately
    setRemoved(prev => new Set([...prev, txnId]))

    const { error } = await supabase
      .from('transactions')
      .update({ category: newCategory, category_ai: false })
      .eq('id', txnId)

    if (error) {
      toast.error('Erro ao atualizar categoria')
      setRemoved(prev => { const s = new Set(prev); s.delete(txnId); return s })
    } else {
      toast.success(`Movido para ${newCategory}`)
      router.refresh()
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openModal}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 10, fontSize: 12,
          background: 'rgba(138,5,190,0.12)',
          border: '1px solid rgba(138,5,190,0.35)',
          color: '#d49dff', fontFamily: 'DM Sans', cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        <Tags size={13} /> Reclassificar gastos
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#0e001a',
                border: '1px solid rgba(138,5,190,0.3)',
                borderRadius: 20,
                padding: 24,
                width: '100%',
                maxWidth: 720,
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f0e6ff', fontFamily: 'Sora' }}>
                    Reclassificar gastos
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9b7db8', fontFamily: 'DM Sans' }}>
                    Arraste o gasto para a categoria correta
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b4d80', padding: 4, lineHeight: 1 }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Category filter pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {uniqueCategories.map(cat => {
                  const count = debits.filter(t => t.category === cat).length
                  const isActive = sourceCategory === cat
                  const color = CATEGORY_COLORS[cat] || '#8A05BE'
                  return (
                    <button
                      key={cat}
                      onClick={() => { setSourceCategory(cat); setRemoved(new Set()) }}
                      style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                        fontFamily: 'DM Sans',
                        background: isActive ? color : 'rgba(255,255,255,0.04)',
                        color: isActive ? '#fff' : '#9b7db8',
                        border: `1px solid ${isActive ? color : 'rgba(138,5,190,0.2)'}`,
                        boxShadow: isActive ? `0 0 10px ${color}44` : 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      {cat} <span style={{ opacity: 0.7 }}>({count})</span>
                    </button>
                  )
                })}
              </div>

              {/* DnD area */}
              <DndContext
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minHeight: 0, flex: 1, overflow: 'hidden' }}>

                  {/* Left: transaction cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', paddingRight: 4 }}>
                    <div style={{ fontSize: 11, color: '#6b4d80', fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {visible.length} gasto{visible.length !== 1 ? 's' : ''} · {sourceCategory}
                    </div>
                    {visible.length === 0 ? (
                      <div style={{ color: '#6b4d80', fontSize: 13, fontFamily: 'DM Sans', paddingTop: 12 }}>
                        Nenhum gasto restante nesta categoria
                      </div>
                    ) : (
                      visible.map(t => <DraggableCard key={t.id} transaction={t} />)
                    )}
                  </div>

                  {/* Right: drop zones */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                    <div style={{ fontSize: 11, color: '#6b4d80', fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Soltar aqui
                    </div>
                    {DROP_CATEGORIES.filter(c => c !== sourceCategory).map(cat => (
                      <CategoryZone key={cat} category={cat} isOver={overId === `zone::${cat}`} />
                    ))}
                  </div>
                </div>

                <DragOverlay dropAnimation={null}>
                  {activeTxn ? <GhostCard transaction={activeTxn} /> : null}
                </DragOverlay>
              </DndContext>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
