'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react'
import { MonthlyStats } from '@/types'
import { formatBRL } from '@/lib/analytics'

function AnimatedNumber({ value, prefix = 'R$ ' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const duration = 1200

    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // cubic ease-out
      setDisplay(eased * value)
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }, [value])

  return <>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(display)}</>
}

const CARDS = [
  {
    key: 'income',
    label: 'Receitas',
    icon: TrendingUp,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.2)',
    getValue: (s: MonthlyStats) => s.totalIncome,
  },
  {
    key: 'expenses',
    label: 'Gastos',
    icon: TrendingDown,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.2)',
    getValue: (s: MonthlyStats) => s.totalExpenses,
  },
  {
    key: 'balance',
    label: 'Saldo do período',
    icon: Wallet,
    color: '#8A05BE',
    bg: 'rgba(138,5,190,0.1)',
    border: 'rgba(138,5,190,0.25)',
    getValue: (s: MonthlyStats) => s.balance,
  },
  {
    key: 'top',
    label: 'Maior gasto',
    icon: AlertCircle,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.2)',
    getValue: (s: MonthlyStats) => s.topExpense?.amount || 0,
    getSubtitle: (s: MonthlyStats) => s.topExpense?.description || '',
  },
]

export default function StatsCards({ stats }: { stats: MonthlyStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((card, i) => {
        const Icon = card.icon
        const value = card.getValue(stats)
        const subtitle = card.getSubtitle?.(stats)

        return (
          <motion.div key={card.key}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="p-5 rounded-2xl"
            style={{ background: '#150025', border: `1px solid rgba(138,5,190,0.2)`, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>

            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: card.bg, border: `1px solid ${card.border}` }}>
                <Icon size={16} style={{ color: card.color }} />
              </div>
            </div>

            <div className="text-xs font-medium mb-1" style={{ fontFamily: 'DM Sans', color: '#9b7db8' }}>
              {card.label}
            </div>
            <div className="text-xl font-bold" style={{ fontFamily: 'Sora', color: card.color }}>
              <AnimatedNumber value={value} />
            </div>
            {subtitle && (
              <div className="text-xs mt-1 truncate" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                {subtitle}
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
