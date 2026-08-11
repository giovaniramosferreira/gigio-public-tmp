'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  active: boolean
}

export default function LoadingCursor({ active }: Props) {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!active) return
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [active])

  useEffect(() => {
    document.body.style.cursor = active ? 'none' : ''
    return () => { document.body.style.cursor = '' }
  }, [active])

  if (!mounted || !active) return null

  return createPortal(
    <>
      <style>{`
        @keyframes poup-spin {
          to { transform: rotate(360deg) }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        left: pos.x - 14,
        top: pos.y - 14,
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: '2.5px solid rgba(138,5,190,0.25)',
        borderTopColor: '#a83eff',
        animation: 'poup-spin 0.7s linear infinite',
        pointerEvents: 'none',
        zIndex: 99999,
      }} />
      {/* ponto central */}
      <div style={{
        position: 'fixed',
        left: pos.x - 3,
        top: pos.y - 3,
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#d49dff',
        pointerEvents: 'none',
        zIndex: 99999,
      }} />
    </>,
    document.body
  )
}
