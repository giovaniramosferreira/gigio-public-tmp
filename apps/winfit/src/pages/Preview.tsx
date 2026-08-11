import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId, MUSCLE_LABEL } from '../data/exercises'

export default function Preview() {
  const plan = useStore((s) => s.plan)
  const nav = useNavigate()
  const [building, setBuilding] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showWhy, setShowWhy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setBuilding(false), 1400)
    return () => clearTimeout(t)
  }, [])

  if (!plan) return <Navigate to="/" replace />

  if (building) {
    return (
      <div className="page-full center" style={{ justifyContent: 'center' }}>
        <div className="fade-in">
          <div style={{ fontSize: 44 }}>🧠</div>
          <h2 style={{ marginTop: 16 }}>Montando seu plano…</h2>
          <p className="muted small" style={{ marginTop: 8 }}>
            Ajustando ao seu equipamento · Distribuindo o volume semanal · Calibrando repetições
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-full fade-in">
      <div className="eyebrow">Seu plano está pronto</div>
      <h1 style={{ marginTop: 8 }}>{plan.splitLabel}</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        {plan.days.length} treinos/semana · ~{Math.round(plan.days.reduce((a, d) => a + d.estMin, 0) / plan.days.length)} min por sessão
      </p>

      {plan.notes.map((n) => (
        <div key={n} className="card small" style={{ marginTop: 14, borderColor: 'rgba(245,185,66,0.4)' }}>
          💡 {n}
        </div>
      ))}

      <button className="card" style={{ marginTop: 14, width: '100%', textAlign: 'left' }} onClick={() => setShowWhy(!showWhy)}>
        <div className="between">
          <h3>Por que este plano?</h3>
          <span className="chev">{showWhy ? '▲' : '▼'}</span>
        </div>
        {showWhy && (
          <ul className="small muted" style={{ marginTop: 10, paddingLeft: 18, display: 'grid', gap: 6 }}>
            {plan.rationale.map((r) => <li key={r}>{r}</li>)}
          </ul>
        )}
      </button>

      <div className="stack" style={{ marginTop: 14, flex: 1 }}>
        {plan.days.map((day) => (
          <button key={day.id} className="card" style={{ width: '100%', textAlign: 'left' }}
            onClick={() => setExpanded(expanded === day.id ? null : day.id)}>
            <div className="between">
              <div>
                <h3>{day.label}</h3>
                <div className="small muted num">{day.exercises.length} exercícios · ~{day.estMin} min</div>
                <div style={{ marginTop: 6 }}>
                  {day.targetMuscles.slice(0, 4).map((m) => (
                    <span key={m} className="muscle-tag">{MUSCLE_LABEL[m]}</span>
                  ))}
                </div>
              </div>
              <span className="chev">{expanded === day.id ? '▲' : '▼'}</span>
            </div>
            {expanded === day.id && (
              <div style={{ marginTop: 12 }}>
                {day.exercises.map((pe) => {
                  const ex = byId.get(pe.exerciseId)
                  return (
                    <div key={pe.id} className="between" style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
                      <span className="small">{ex?.name}</span>
                      <span className="small faint num">{pe.sets}×{pe.repMin}–{pe.repMax}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => nav('/home')}>Salvar meu plano</button>
        <button className="btn btn-quiet" onClick={() => nav('/onboarding')}>Ajustar respostas</button>
      </div>
    </div>
  )
}
