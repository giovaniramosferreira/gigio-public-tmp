import type { Session } from '../types'

export function startOfWeek(d = new Date()): Date {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7 // segunda = 0
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - day)
  return x
}

export function sessionsThisWeek(sessions: Session[]): Session[] {
  const from = startOfWeek().getTime()
  return sessions.filter((s) => s.startedAt >= from && (s.status === 'completed' || s.status === 'partial'))
}

export function sessionsInWeekOffset(sessions: Session[], offset: number): Session[] {
  const start = startOfWeek()
  start.setDate(start.getDate() + offset * 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return sessions.filter(
    (s) => s.startedAt >= start.getTime() && s.startedAt < end.getTime() && (s.status === 'completed' || s.status === 'partial'),
  )
}

export function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

export function fmtDuration(ms: number): string {
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`
}

export function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch { /* sem suporte */ }
}

let audioCtx: AudioContext | null = null
export function beep() {
  try {
    audioCtx = audioCtx ?? new AudioContext()
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.connect(g)
    g.connect(audioCtx.destination)
    o.frequency.value = 880
    g.gain.setValueAtTime(0.001, audioCtx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5)
    o.start()
    o.stop(audioCtx.currentTime + 0.55)
  } catch { /* sem suporte */ }
}
