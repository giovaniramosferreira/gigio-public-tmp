import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId } from '../data/exercises'
import { fmtDuration } from '../lib/helpers'
import { fmtKg, volumeOf } from '../lib/progression'

export default function Summary() {
  const { id } = useParams()
  const nav = useNavigate()
  const sessions = useStore((s) => s.sessions)
  const session = sessions.find((s) => s.id === id)

  if (!session) return <Navigate to="/home" replace />

  const volume = volumeOf(session.logs)
  const prs = session.logs.filter((l) => l.isPR)
  const previous = sessions.find((s) => s.id !== session.id && s.dayId === session.dayId && s.startedAt < session.startedAt)
  const prevVolume = previous ? volumeOf(previous.logs) : null
  const delta = prevVolume != null && prevVolume > 0 ? Math.round(((volume - prevVolume) / prevVolume) * 100) : null

  return (
    <div className="page-full fade-in">
      <div style={{ paddingTop: 32 }} className="center">
        <div style={{ fontSize: 52 }}>{prs.length > 0 ? '🏅' : '✅'}</div>
        <h1 style={{ marginTop: 12 }}>Treino concluído!</h1>
        <p className="muted" style={{ marginTop: 6 }}>{session.dayLabel}</p>
      </div>

      <div className="stat-grid" style={{ marginTop: 24 }}>
        <div className="stat">
          <div className="v num">{session.endedAt ? fmtDuration(session.endedAt - session.startedAt) : '—'}</div>
          <div className="k">Duração</div>
        </div>
        <div className="stat">
          <div className="v num">{session.logs.length}</div>
          <div className="k">Séries registradas</div>
        </div>
        <div className="stat">
          <div className="v num">{volume >= 1000 ? `${(volume / 1000).toFixed(1).replace('.', ',')} t` : `${Math.round(volume)} kg`}</div>
          <div className="k">Volume total</div>
        </div>
        <div className="stat">
          <div className="v num" style={{ color: delta != null && delta > 0 ? 'var(--green)' : undefined }}>
            {delta != null ? `${delta > 0 ? '+' : ''}${delta}%` : '—'}
          </div>
          <div className="k">vs. último {session.dayLabel.split(' ')[0]}</div>
        </div>
      </div>

      {prs.length > 0 && (
        <div className="card" style={{ marginTop: 14, borderColor: 'rgba(245,185,66,0.4)' }}>
          <h3 className="gold">🏅 Recordes desta sessão</h3>
          {prs.map((l) => (
            <div key={l.id} className="between" style={{ marginTop: 8 }}>
              <span className="small">{byId.get(l.exerciseId)?.name}</span>
              <b className="num gold">{fmtKg(l.weight)} × {l.reps}</b>
            </div>
          ))}
        </div>
      )}

      <div className="grow" />
      <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => nav('/home', { replace: true })}>
        Concluir
      </button>
    </div>
  )
}
