import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId, MUSCLE_LABEL } from '../data/exercises'
import { greeting, sessionsThisWeek, startOfWeek } from '../lib/helpers'
import { fmtKg } from '../lib/progression'

export default function Home() {
  const nav = useNavigate()
  const plan = useStore((s) => s.plan)!
  const sessions = useStore((s) => s.sessions)
  const active = useStore((s) => s.activeSession)
  const prs = useStore((s) => s.prs)
  const startSession = useStore((s) => s.startSession)
  const resumeState = useStore((s) => s.resumeOrExpireSession)
  const saveExpired = useStore((s) => s.saveExpiredAsPartial)
  const discard = useStore((s) => s.discardActive)
  const profile = useStore((s) => s.profile)!
  const [expiredPrompt, setExpiredPrompt] = useState(false)
  const [pickDay, setPickDay] = useState(false)

  const weekSessions = sessionsThisWeek(sessions)
  const goal = Math.min(profile.frequency, plan.days.length)

  // Próximo treino = dia seguinte ao último executado (a semana "desliza" — regra R2 da spec).
  const nextDay = useMemo(() => {
    const done = sessions
      .filter((s) => s.planId === plan.id)
      .sort((a, b) => b.startedAt - a.startedAt)
    if (done.length === 0) return plan.days[0]
    const lastPos = plan.days.findIndex((d) => d.id === done[0].dayId)
    return plan.days[(lastPos + 1) % plan.days.length] ?? plan.days[0]
  }, [sessions, plan])

  const lastPR = prs.length > 0 ? prs[0] : null

  const handleStart = () => {
    const state = resumeState()
    if (state === 'resumable') return nav('/player')
    if (state === 'expired') return setExpiredPrompt(true)
    startSession(nextDay.id)
    nav('/player')
  }

  // Bolinhas da semana (seg–dom)
  const week = useMemo(() => {
    const start = startOfWeek()
    const labels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return labels.map((lbl, i) => {
      const day = new Date(start); day.setDate(start.getDate() + i)
      const has = weekSessions.some((s) => {
        const d = new Date(s.startedAt); d.setHours(0, 0, 0, 0)
        return d.getTime() === day.getTime()
      })
      return { lbl, done: has, today: day.getTime() === today.getTime() }
    })
  }, [weekSessions])

  return (
    <div className="page fade-in">
      <p className="muted small">{greeting()} 👋</p>
      <h1 style={{ marginTop: 2 }}>
        {weekSessions.length >= goal ? 'Semana fechada. 🎉' : 'Pronto para treinar?'}
      </h1>

      <div className="hero-card" style={{ marginTop: 16 }}>
        <div className="eyebrow">{active ? 'Treino em andamento' : 'Treino de hoje'}</div>
        <h2 style={{ marginTop: 8, fontSize: 22 }}>{active ? active.dayLabel : nextDay.label}</h2>
        {!active && (
          <>
            <p className="muted small num" style={{ marginTop: 4 }}>
              {nextDay.exercises.length} exercícios · ~{nextDay.estMin} min
            </p>
            <div style={{ marginTop: 8 }}>
              {nextDay.targetMuscles.slice(0, 4).map((m) => (
                <span key={m} className="muscle-tag">{MUSCLE_LABEL[m]}</span>
              ))}
            </div>
          </>
        )}
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleStart}>
          {active ? 'Continuar treino' : 'Começar treino'}
        </button>
        {!active && (
          <button className="btn-quiet btn" onClick={() => setPickDay(true)}>
            Treinar outro dia do plano
          </button>
        )}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="between">
          <h3>Minha semana</h3>
          <span className="pill accent num">{weekSessions.length}/{goal} treinos</span>
        </div>
        <div className="week-dots" style={{ marginTop: 12 }}>
          {week.map((d, i) => (
            <div key={i} className={`week-dot ${d.done ? 'done' : ''} ${d.today ? 'today' : ''}`}>
              <div className="dot">{d.done ? '✓' : ''}</div>
              <div className="lbl">{d.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {lastPR && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="row">
            <span style={{ fontSize: 24 }}>🏅</span>
            <div>
              <h3 className="gold">Último recorde</h3>
              <div className="small muted">
                {byId.get(lastPR.exerciseId)?.name}: <b className="num">{fmtKg(lastPR.value)} × {lastPR.reps}</b>
              </div>
            </div>
          </div>
        </div>
      )}

      {pickDay && (
        <div className="modal-back" onClick={() => setPickDay(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Escolher treino</h2>
            <div style={{ marginTop: 10 }}>
              {plan.days.map((d) => (
                <button key={d.id} className="list-item" onClick={() => { startSession(d.id); nav('/player') }}>
                  <div className="grow">
                    <h3>{d.label}</h3>
                    <span className="small muted num">{d.exercises.length} exercícios · ~{d.estMin} min</span>
                  </div>
                  <span className="chev">›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {expiredPrompt && active && (
        <div className="modal-back">
          <div className="modal">
            <h2>Treino inacabado</h2>
            <p className="muted small" style={{ marginTop: 8 }}>
              Você não finalizou <b>{active.dayLabel}</b>. O que fazer com as {active.logs.length} séries registradas?
            </p>
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => { saveExpired(); setExpiredPrompt(false) }}>
                Salvar como treino parcial
              </button>
              <button className="btn btn-danger" style={{ marginTop: 10 }} onClick={() => { discard(); setExpiredPrompt(false) }}>
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
