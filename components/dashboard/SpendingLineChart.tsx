'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Transaction } from '@/types'
import { formatBRL, CATEGORY_COLORS } from '@/lib/analytics'

interface Props {
  transactions: Transaction[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.[0]) return null
  const details: { label: string; amount: number; color: string }[] = payload[0]?.payload?.details ?? []
  return (
    <div className="rounded-xl text-sm"
      style={{ background: '#1e0035', border: '1px solid rgba(138,5,190,0.4)', fontFamily: 'DM Sans', color: '#f0e6ff', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', minWidth: 160 }}>
      <div className="px-3 pt-2.5 pb-2 border-b" style={{ borderColor: 'rgba(138,5,190,0.25)' }}>
        <div className="text-xs mb-0.5" style={{ color: '#9b7db8' }}>Dia {label}</div>
        <div className="font-bold" style={{ color: '#d49dff' }}>{formatBRL(payload[0].value)}</div>
      </div>
      {details.length > 0 && (
        <div className="px-3 py-2 flex flex-col gap-1">
          {details.map(d => (
            <div key={d.label} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-xs" style={{ color: '#c4a8e0' }}>{d.label}</span>
              </div>
              <span className="text-xs font-medium" style={{ color: '#f0e6ff' }}>{formatBRL(d.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SpendingLineChart({ transactions }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('Todos')

  const debits = transactions.filter(t => t.type === 'debit')

  // Categorias únicas disponíveis
  const categories = useMemo(() => {
    return Array.from(new Set(debits.map(t => t.category))).sort()
  }, [debits])

  // Dados agrupados por dia
  const chartData = useMemo(() => {
    const filtered = activeCategory === 'Todos'
      ? debits
      : debits.filter(t => t.category === activeCategory)

    const byDay: Record<string, number> = {}
    const byDayCategory: Record<string, Record<string, number>> = {}

    for (const t of filtered) {
      const day = t.date.slice(8, 10)
      byDay[day] = (byDay[day] || 0) + t.amount
      if (!byDayCategory[day]) byDayCategory[day] = {}
      byDayCategory[day][t.category] = (byDayCategory[day][t.category] || 0) + t.amount
    }

    const days = Array.from(new Set(debits.map(t => t.date.slice(8, 10)))).sort()
    return days.map(day => {
      const catMap = byDayCategory[day] ?? {}
      const details = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amount]) => ({
          label: cat,
          amount: parseFloat(amount.toFixed(2)),
          color: CATEGORY_COLORS[cat] || '#8A05BE',
        }))
      return {
        day,
        total: parseFloat((byDay[day] || 0).toFixed(2)),
        details,
      }
    })
  }, [debits, activeCategory])

  const color = activeCategory === 'Todos' ? '#8A05BE' : (CATEGORY_COLORS[activeCategory] || '#8A05BE')
  const gradientId = 'spendingGradient'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="p-4 md:p-6 rounded-2xl"
      style={{ background: '#150025', border: '1px solid rgba(138,5,190,0.2)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h3 className="text-base font-semibold" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
          Gastos por dia
        </h3>
        <span className="text-xs" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
          {chartData.length} dias com movimentação
        </span>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {['Todos', ...categories].map(cat => {
          const isActive = activeCategory === cat
          const catColor = cat === 'Todos' ? '#8A05BE' : (CATEGORY_COLORS[cat] || '#6b7280')
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: isActive ? catColor : 'rgba(255,255,255,0.04)',
                color: isActive ? '#fff' : '#9b7db8',
                border: `1px solid ${isActive ? catColor : 'rgba(138,5,190,0.2)'}`,
                fontFamily: 'DM Sans',
                boxShadow: isActive ? `0 0 12px ${catColor}55` : 'none',
              }}>
              {cat}
            </button>
          )
        })}
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
          Nenhum gasto nesta categoria
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(138,5,190,0.1)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#9b7db8', fontSize: 11, fontFamily: 'DM Sans' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#9b7db8', fontSize: 11, fontFamily: 'DM Sans' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v === 0 ? '' : `R$${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}${v >= 1000 ? 'k' : ''}`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="total"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, fill: color, stroke: '#150025', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}
