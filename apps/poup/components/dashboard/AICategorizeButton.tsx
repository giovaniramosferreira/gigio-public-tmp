'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Transaction } from '@/types'
import AICategorizeModal from './AICategorizeModal'

interface Props {
  transactions: Transaction[]
}

export default function AICategorizeButton({ transactions }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const targets = transactions.filter(t => t.category === 'Outros' && t.type === 'debit')

  if (targets.length === 0) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
        style={{
          background: 'rgba(138,5,190,0.15)',
          border: '1px solid rgba(138,5,190,0.35)',
          color: '#d49dff',
          fontFamily: 'DM Sans',
          cursor: 'pointer',
        }}>
        <Sparkles size={13} />
        IA: {targets.length} sem categoria
      </button>

      {open && (
        <AICategorizeModal
          targets={targets}
          onClose={() => setOpen(false)}
          onDone={() => router.refresh()}
        />
      )}
    </>
  )
}
