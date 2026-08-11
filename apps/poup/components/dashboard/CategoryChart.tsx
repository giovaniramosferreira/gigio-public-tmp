'use client'

import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { CategorySummary } from '@/types'
import { formatBRL } from '@/lib/analytics'

interface Props { categories: CategorySummary[] }

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="px-3 py-2 rounded-xl text-sm"
      style={{ background: '#1e0035', border: '1px solid rgba(138,5,190,0.3)', fontFamily: 'DM Sans', color: '#f0e6ff' }}>
      <div className="font-semibold">{d.category}</div>
      <div style={{ color: '#d49dff' }}>{formatBRL(d.total)}</div>
      <div style={{ color: '#9b7db8' }}>{d.percentage.toFixed(1)}%</div>
    </div>
  )
}

export default function CategoryChart({ categories }: Props) {
  const top = categories.slice(0, 7)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="p-4 md:p-6 rounded-2xl"
      style={{ background: '#150025', border: '1px solid rgba(138,5,190,0.2)' }}>

      <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
        Gastos por categoria
      </h3>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:w-48 h-36 md:h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={top} cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                dataKey="total" paddingAngle={3}>
                {top.map((entry, i) => (
                  <Cell key={i} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 w-full space-y-2">
          {top.map(cat => (
            <div key={cat.category} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs truncate" style={{ fontFamily: 'DM Sans', color: '#f0e6ff' }}>{cat.category}</span>
                  <span className="text-xs font-semibold flex-shrink-0" style={{ fontFamily: 'DM Sans', color: '#d49dff' }}>{formatBRL(cat.total)}</span>
                </div>
                <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(138,5,190,0.15)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.percentage}%` }}
                    transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: cat.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
