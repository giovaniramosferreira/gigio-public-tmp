import { useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId, EQUIP_LABEL, MUSCLE_LABEL } from '../data/exercises'
import { fmtDate } from '../lib/helpers'
import { fmtKg } from '../lib/progression'
import Chart from '../components/Chart'

export default function ExerciseDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const sessions = useStore((s) => s.sessions)
  const active = useStore((s) => s.activeSession)
  const exercise = id ? byId.get(id) : undefined

  const history = useMemo(() => {
    if (!exercise) return []
    return sessions
      .filter((s) => s.logs.some((l) => l.exerciseId === exercise.id))
      .sort((a, b) => a.startedAt - b.startedAt)
      .map((s) => {
        const logs = s.logs.filter((l) => l.exerciseId === exercise.id)
        return {
          ts: s.startedAt,
          max: Math.max(...logs.map((l) => l.weight)),
          sets: logs.map((l) => `${l.weight > 0 ? l.weight : '—'}×${l.reps}`).join('  '),
        }
      })
  }, [sessions, exercise])

  if (!exercise) return <Navigate to="/library" replace />

  const chartData = history.filter((h) => h.max > 0).map((h) => ({ label: fmtDate(h.ts), value: h.max }))

  return (
    <div className="page fade-in">
      <button className="btn-quiet" onClick={() => nav(-1)} style={{ padding: '4px 0' }}>
        ← Voltar{active ? ' ao treino' : ''}
      </button>
      <h1 style={{ marginTop: 8 }}>{exercise.name}</h1>
      <div style={{ marginTop: 8 }}>
        <span className="muscle-tag" style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)' }}>
          {MUSCLE_LABEL[exercise.primary]}
        </span>
        {exercise.secondary.map((m) => <span key={m} className="muscle-tag">{MUSCLE_LABEL[m]}</span>)}
      </div>
      <p className="tiny faint" style={{ marginTop: 6 }}>
        Equipamento: {exercise.equipment.map((e) => EQUIP_LABEL[e]).join(' + ')}
      </p>

      <div className="card" style={{ marginTop: 14 }}>
        <h3>Como executar</h3>
        <ol className="small muted" style={{ marginTop: 8, paddingLeft: 20, display: 'grid', gap: 6 }}>
          {exercise.instructions.map((i) => <li key={i}>{i}</li>)}
        </ol>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>⚠️ Erros comuns</h3>
        <ul className="small muted" style={{ marginTop: 8, paddingLeft: 20, display: 'grid', gap: 6 }}>
          {exercise.mistakes.map((m) => <li key={m}>{m}</li>)}
        </ul>
      </div>

      {chartData.length >= 2 && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="between">
            <h3>Sua evolução de carga</h3>
            <span className="pill gold num">{fmtKg(Math.max(...chartData.map((d) => d.value)))}</span>
          </div>
          <div style={{ marginTop: 10 }}>
            <Chart data={chartData} unit="" />
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Seu histórico</h3>
          {[...history].reverse().slice(0, 10).map((h) => (
            <div key={h.ts} className="list-item">
              <span className="tiny faint num" style={{ width: 60 }}>{fmtDate(h.ts)}</span>
              <span className="small num grow">{h.sets}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
