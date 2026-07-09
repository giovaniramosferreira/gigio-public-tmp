import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'

/** Sessão ativa persiste em qualquer tab — padrão player de música (seção 16 da spec). */
export default function MiniBar() {
  const active = useStore((s) => s.activeSession)
  const nav = useNavigate()
  if (!active) return null
  const done = active.exercises.filter((e) => {
    const logged = active.logs.filter((l) => l.planExerciseId === e.planExerciseId).length
    return e.skipped || logged >= e.sets
  }).length
  return (
    <button className="minibar" onClick={() => nav('/player')}>
      <span>▶ {active.dayLabel}</span>
      <span className="num">{done}/{active.exercises.length} exercícios</span>
    </button>
  )
}
