'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import LoadingCursor from '@/components/ui/LoadingCursor'

interface MonthFilterProps {
  months: { value: string; label: string }[]
  selected: string
  view: 'fatura' | 'mes'
}

export default function MonthFilter({ months, selected, view }: MonthFilterProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigate = (params: Record<string, string>) => {
    const url = new URL(window.location.href)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    startTransition(() => router.push(url.pathname + url.search))
  }

  return (
    <>
    <LoadingCursor active={isPending} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: isPending ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      {/* Toggle visão */}
      <div style={{
        display: 'flex', borderRadius: 10, overflow: 'hidden',
        border: '1px solid rgba(138,5,190,0.3)', background: '#150025',
      }}>
        {(['fatura', 'mes'] as const).map(v => (
          <button
            key={v}
            onClick={() => navigate({ view: v, month: selected })}
            style={{
              padding: '7px 13px', fontSize: 12, fontFamily: 'DM Sans',
              cursor: 'pointer', border: 'none', fontWeight: view === v ? 600 : 400,
              background: view === v ? 'rgba(138,5,190,0.25)' : 'transparent',
              color: view === v ? '#d49dff' : '#6b4d80',
              transition: 'all 0.15s',
            }}>
            {v === 'fatura' ? 'Fatura' : 'Mês'}
          </button>
        ))}
      </div>

      {/* Seletor de período */}
      <select
        value={selected}
        onChange={e => navigate({ month: e.target.value, view })}
        style={{
          padding: '7px 12px', borderRadius: 10, fontSize: 13,
          background: '#150025', border: '1px solid rgba(138,5,190,0.3)',
          color: '#f0e6ff', fontFamily: 'DM Sans', outline: 'none', cursor: 'pointer',
        }}
      >
        {months.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
    </>
  )
}
