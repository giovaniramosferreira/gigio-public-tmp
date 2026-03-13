'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Transaction } from '@/types'
import { formatBRL, formatDate, CATEGORY_COLORS } from '@/lib/analytics'
import { Search } from 'lucide-react'

interface Props { transactions: Transaction[] }

export default function TransactionList({ transactions }: Props) {
  const [search, setSearch] = useState('')

  const filtered = transactions.filter(t =>
    t.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5 }}
      className="p-6 rounded-2xl flex flex-col"
      style={{ background: '#150025', border: '1px solid rgba(138,5,190,0.2)' }}>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
          Transações recentes
        </h3>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(138,5,190,0.15)', color: '#d49dff', fontFamily: 'DM Sans' }}>
          {filtered.length}
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9b7db8' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar transação..."
          className="w-full pl-8 pr-3 py-2 rounded-xl text-xs"
          style={{
            background: '#0d001a',
            border: '1px solid rgba(138,5,190,0.2)',
            color: '#f0e6ff',
            fontFamily: 'DM Sans',
            outline: 'none',
          }}
          onFocus={e  => (e.currentTarget.style.borderColor = '#8A05BE')}
          onBlur={e   => (e.currentTarget.style.borderColor = 'rgba(138,5,190,0.2)')}
        />
      </div>

      {/* List */}
      <div className="space-y-2 overflow-y-auto max-h-72 pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
            Nenhuma transação encontrada.
          </div>
        ) : (
          filtered.map((t, i) => (
            <motion.div key={t.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
              style={{ background: 'rgba(138,5,190,0.06)', border: '1px solid rgba(138,5,190,0.1)' }}>
              {/* Category dot */}
              <div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: CATEGORY_COLORS[t.category] || '#6b7280' }} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate" style={{ fontFamily: 'DM Sans', color: '#f0e6ff' }}>
                  {t.description}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                  {formatDate(t.date)} · <span style={{ color: CATEGORY_COLORS[t.category] || '#6b7280' }}>{t.category}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-sm font-semibold flex-shrink-0"
                style={{ fontFamily: 'Sora', color: t.type === 'credit' ? '#22c55e' : '#ef4444' }}>
                {t.type === 'credit' ? '+' : '-'}{formatBRL(t.amount)}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
