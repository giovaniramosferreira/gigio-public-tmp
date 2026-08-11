'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, AlertTriangle, Minus } from 'lucide-react'

interface StoryCardProps {
  story: { headline: string; body: string; tone: 'positive' | 'neutral' | 'warning' }
  monthLabel: string
}

const TONE_STYLES = {
  positive: {
    icon: TrendingUp,
    iconColor: '#22c55e',
    bg: 'rgba(34,197,94,0.06)',
    border: 'rgba(34,197,94,0.2)',
    label: '🎉 Mês positivo',
    labelColor: '#22c55e',
  },
  neutral: {
    icon: Minus,
    iconColor: '#8A05BE',
    bg: 'rgba(138,5,190,0.08)',
    border: 'rgba(138,5,190,0.25)',
    label: '📊 Resumo do mês',
    labelColor: '#d49dff',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.25)',
    label: '📌 Atenção',
    labelColor: '#f59e0b',
  },
}

export default function StoryCard({ story, monthLabel }: StoryCardProps) {
  const style = TONE_STYLES[story.tone]
  const Icon  = style.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.6 }}
      className="p-6 rounded-2xl"
      style={{ background: style.bg, border: `1px solid ${style.border}` }}>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(138,5,190,0.15)' }}>
          <Sparkles size={16} style={{ color: '#d49dff' }} />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: style.labelColor, fontFamily: 'DM Sans' }}>
            {style.label}
          </div>
          <div className="text-xs" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>{monthLabel}</div>
        </div>
        <Icon size={16} style={{ color: style.iconColor, marginLeft: 'auto' }} />
      </div>

      <p className="text-base font-semibold mb-2 leading-snug" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
        {story.headline}
      </p>
      <p className="text-sm leading-relaxed" style={{ fontFamily: 'DM Sans', color: '#9b7db8' }}>
        {story.body}
      </p>
    </motion.div>
  )
}
