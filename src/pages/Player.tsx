import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId } from '../data/exercises'
import { lastPerformance, suggestFor, fmtKg } from '../lib/progression'
import { equivalentsFor } from '../lib/generator'
import { fmtClock, beep, vibrate } from '../lib/helpers'
import type { Exercise, PlanExercise } from '../types'

const TIMED_IDS = new Set(['prancha', 'prancha-lateral'])

export default function Player() {
  const nav = useNavigate()
  const session = useStore((s) => s.activeSession)
  const sessions = useStore((s) => s.sessions)
  const profile = useStore((s) => s.profile)
  const logSet = useStore((s) => s.logSet)
  const editSet = useStore((s) => s.editSet)
  const deleteSet = useStore((s) => s.deleteSet)
  const skipExercise = useStore((s) => s.skipExercise)
  const setCurrentIndex = useStore((s) => s.setCurrentIndex)
  const substitute = useStore((s) => s.substitute)
  const finishSession = useStore((s) => s.finishSession)
  const discardActive = useStore((s) => s.discardActive)

  const [editor, setEditor] = useState<{ weight: number; reps: number; logId?: string } | null>(null)
  const [subOpen, setSubOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)
  const [prFlash, setPrFlash] = useState<string | null>(null)

  if (!session || !profile) return <Navigate to="/home" replace />

  const idx = session.currentIndex
  const sx = session.exercises[idx]
  const exercise = byId.get(sx.exerciseId)!
  const isTimed = TIMED_IDS.has(exercise.id)

  const planExLike: PlanExercise = {
    id: sx.planExerciseId, exerciseId: sx.exerciseId, slotType: 'core',
    sets: sx.sets, repMin: sx.repMin, repMax: sx.repMax, restSec: sx.restSec, optional: sx.optional,
  }
  const suggestion = useMemo(() => suggestFor(planExLike, exercise, sessions), [sx.exerciseId, sessions])
  const prev = useMemo(() => lastPerformance(sx.exerciseId, sessions), [sx.exerciseId, sessions])

  const logsHere = session.logs.filter((l) => l.planExerciseId === sx.planExerciseId)
  const nextSetNumber = logsHere.length + 1
  const totalSets = session.exercises.filter((e) => !e.skipped).reduce((a, e) => a + e.sets, 0)
  const doneSets = session.logs.length
  const allExercisesDone = session.exercises.every((e) => {
    const n = session.logs.filter((l) => l.planExerciseId === e.planExerciseId).length
    return e.skipped || n >= e.sets
  })

  const defaultWeight = () => {
    if (logsHere.length > 0) return logsHere[logsHere.length - 1].weight
    if (exercise.loadType !== 'external') return 0
    return suggestion.weight ?? 0
  }
  const defaultReps = () => {
    if (logsHere.length > 0) return logsHere[logsHere.length - 1].reps
    return suggestion.targetReps
  }

  const quickLog = () => {
    // Primeira série de um exercício de carga externa sem referência: pedir a carga
    // (logar 0 kg silenciosamente corromperia o histórico e a progressão).
    if (exercise.loadType === 'external' && defaultWeight() === 0) {
      setEditor({ weight: 0, reps: defaultReps() })
      return
    }
    const log = logSet(idx, defaultWeight(), defaultReps())
    vibrate(30)
    if (log?.isPR) {
      setPrFlash(`🏅 Novo recorde: ${fmtKg(log.weight)}!`)
      setTimeout(() => setPrFlash(null), 3500)
    }
  }

  const confirmEditor = () => {
    if (!editor) return
    if (editor.logId) {
      editSet(editor.logId, editor.weight, editor.reps)
    } else {
      const log = logSet(idx, editor.weight, editor.reps)
      vibrate(30)
      if (log?.isPR) {
        setPrFlash(`🏅 Novo recorde: ${fmtKg(log.weight)}!`)
        setTimeout(() => setPrFlash(null), 3500)
      }
    }
    setEditor(null)
  }

  const goNext = () => setCurrentIndex(Math.min(idx + 1, session.exercises.length - 1))
  const goPrev = () => setCurrentIndex(Math.max(idx - 1, 0))

  const doFinish = (rpe?: number) => {
    const id = finishSession(rpe)
    if (id) nav(`/summary/${id}`, { replace: true })
    else nav('/home', { replace: true })
  }

  const unit = isTimed ? 'seg' : 'reps'
  const inc = exercise.minIncrementKg

  return (
    <div className="player">
      <header className="player-head">
        <div className="between">
          <button className="btn-quiet" onClick={() => nav('/home')}>▾ Minimizar</button>
          <span className="small muted num">{doneSets}/{totalSets} séries</span>
          <button className="btn-quiet" onClick={() => setMenuOpen(true)}>⋯</button>
        </div>
        <div className="player-progress"><div style={{ width: `${(doneSets / Math.max(totalSets, 1)) * 100}%` }} /></div>
      </header>

      <main className="player-body">
        <div className="between">
          <span className="eyebrow num">Exercício {idx + 1} de {session.exercises.length}</span>
          {sx.substitutedFrom && <span className="pill">substituído</span>}
        </div>
        <h1 style={{ marginTop: 6, fontSize: 24 }}>{exercise.name}</h1>
        <p className="small muted num" style={{ marginTop: 4 }}>
          Meta: {sx.sets} × {sx.repMin}–{sx.repMax} {unit}
          {exercise.loadType === 'external' && suggestion.weight != null && suggestion.weight > 0 && (
            <> · <b className={suggestion.isIncrease ? 'green' : ''}>{fmtKg(suggestion.weight)}</b></>
          )}
        </p>
        <p className="tiny faint" style={{ marginTop: 4 }}>{suggestion.note}</p>

        {prFlash && <div className="pr-flash" style={{ marginTop: 12 }}>{prFlash}</div>}

        <div className="card" style={{ marginTop: 14, padding: '6px 14px' }}>
          <div className="set-row" style={{ borderBottom: '1px solid var(--line)' }}>
            <span className="tiny faint center">#</span>
            <span className="tiny faint center">Anterior</span>
            <span className="tiny faint center">kg</span>
            <span className="tiny faint center">{unit}</span>
            <span />
          </div>
          {Array.from({ length: Math.max(sx.sets, logsHere.length) }, (_, i) => {
            const log = logsHere[i]
            const prevSet = prev?.[i]
            const isNext = i === logsHere.length
            return (
              <div className="set-row" key={i}>
                <span className="n num">{i + 1}</span>
                <span className="prev num">{prevSet ? `${prevSet.weight > 0 ? prevSet.weight : '—'}×${prevSet.reps}` : '—'}</span>
                {log ? (
                  <>
                    <button className="set-cell done num" onClick={() => setEditor({ weight: log.weight, reps: log.reps, logId: log.id })}>
                      {log.weight > 0 ? log.weight : '—'}
                    </button>
                    <button className="set-cell done num" onClick={() => setEditor({ weight: log.weight, reps: log.reps, logId: log.id })}>
                      {log.reps}
                    </button>
                    <span className="check-btn done">✓</span>
                  </>
                ) : (
                  <>
                    <button className="set-cell num" disabled={!isNext}
                      onClick={() => setEditor({ weight: defaultWeight(), reps: defaultReps() })}>
                      {isNext && exercise.loadType === 'external' ? (defaultWeight() || '?') : isNext ? '—' : ''}
                    </button>
                    <button className="set-cell num" disabled={!isNext}
                      onClick={() => setEditor({ weight: defaultWeight(), reps: defaultReps() })}>
                      {isNext ? defaultReps() : ''}
                    </button>
                    <button className="check-btn" disabled={!isNext} onClick={quickLog}>✓</button>
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-ghost btn-sm grow" onClick={() => setSubOpen(true)}>⇄ Trocar</button>
          <button className="btn btn-ghost btn-sm grow" onClick={() => nav(`/exercise/${exercise.id}`)}>ℹ Como fazer</button>
          <button className="btn btn-ghost btn-sm grow" onClick={() => { skipExercise(idx) }}>Pular →</button>
        </div>

        <RestTimer />
      </main>

      <footer className="player-foot">
        <div className="row">
          <button className="btn btn-ghost" style={{ flex: 1 }} disabled={idx === 0} onClick={goPrev}>← Anterior</button>
          {allExercisesDone || idx === session.exercises.length - 1 ? (
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setFinishOpen(true)}>
              Encerrar treino
            </button>
          ) : (
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={goNext}>Próximo →</button>
          )}
        </div>
      </footer>

      {editor && (
        <div className="modal-back" onClick={() => setEditor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editor.logId ? 'Editar série' : `Série ${nextSetNumber}`}</h2>
            {exercise.loadType === 'external' && (
              <>
                <label className="field">Carga (kg)</label>
                <div className="stepper">
                  <button onClick={() => setEditor({ ...editor, weight: Math.max(0, +(editor.weight - inc).toFixed(1)) })}>−</button>
                  <span className="val num">{editor.weight}</span>
                  <button onClick={() => setEditor({ ...editor, weight: +(editor.weight + inc).toFixed(1) })}>+</button>
                </div>
              </>
            )}
            <label className="field">{isTimed ? 'Segundos' : 'Repetições'}</label>
            <div className="stepper">
              <button onClick={() => setEditor({ ...editor, reps: Math.max(1, editor.reps - (isTimed ? 5 : 1)) })}>−</button>
              <span className="val num">{editor.reps}</span>
              <button onClick={() => setEditor({ ...editor, reps: editor.reps + (isTimed ? 5 : 1) })}>+</button>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={confirmEditor}>
              {editor.logId ? 'Salvar' : 'Registrar série ✓'}
            </button>
            {editor.logId && (
              <button className="btn btn-danger" style={{ marginTop: 10 }}
                onClick={() => { deleteSet(editor.logId!); setEditor(null) }}>
                Excluir série
              </button>
            )}
          </div>
        </div>
      )}

      {subOpen && (
        <SubstituteModal
          exercise={exercise}
          onClose={() => setSubOpen(false)}
          onPick={(newId, scope) => { substitute(idx, newId, scope); setSubOpen(false) }}
        />
      )}

      {menuOpen && (
        <div className="modal-back" onClick={() => setMenuOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Opções</h2>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-ghost" onClick={() => { setMenuOpen(false); setFinishOpen(true) }}>
                Encerrar treino agora
              </button>
              <button className="btn btn-danger" style={{ marginTop: 10 }}
                onClick={() => { if (confirm('Descartar este treino? As séries registradas serão perdidas.')) { discardActive(); nav('/home') } }}>
                Descartar treino
              </button>
              <button className="btn btn-quiet" onClick={() => setMenuOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {finishOpen && (
        <div className="modal-back" onClick={() => setFinishOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Como foi o treino?</h2>
            <p className="muted small" style={{ marginTop: 6 }}>
              {doneSets < totalSets
                ? `Você registrou ${doneSets} de ${totalSets} séries. O treino será salvo como parcial.`
                : 'Todas as séries registradas. 💪'}
            </p>
            <div className="row" style={{ marginTop: 16, justifyContent: 'space-between' }}>
              {[['😮‍💨', 1], ['🙂', 2], ['😊', 3], ['😤', 4], ['🥵', 5]].map(([e, v]) => (
                <button key={v} style={{ fontSize: 34, padding: 6 }} onClick={() => doFinish(v as number)}>{e}</button>
              ))}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => doFinish(undefined)}>
              Encerrar sem avaliar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RestTimer() {
  const timer = useStore((s) => s.activeSession?.timer ?? null)
  const clearTimer = useStore((s) => s.clearTimer)
  const startTimer = useStore((s) => s.startTimer)
  const [, force] = useState(0)
  const firedFor = useRef<number | null>(null)

  useEffect(() => {
    if (!timer) return
    const iv = setInterval(() => force((x) => x + 1), 250)
    return () => clearInterval(iv)
  }, [timer])

  if (!timer) return null
  const remaining = Math.ceil((timer.endsAt - Date.now()) / 1000)

  if (remaining <= 0) {
    if (firedFor.current !== timer.endsAt) {
      firedFor.current = timer.endsAt
      beep()
      vibrate([180, 90, 180])
    }
    return (
      <div className="timer-bar" style={{ marginTop: 14, borderColor: 'rgba(62,207,142,0.4)', background: 'rgba(62,207,142,0.1)' }}>
        <span className="t green">0:00</span>
        <span className="grow small green">Descanso encerrado — próxima série!</span>
        <button className="btn btn-ghost btn-sm" onClick={clearTimer}>OK</button>
      </div>
    )
  }

  return (
    <div className="timer-bar" style={{ marginTop: 14 }}>
      <span className="t num">{fmtClock(remaining)}</span>
      <span className="grow small muted">descanso</span>
      <button className="btn btn-ghost btn-sm" onClick={() => startTimer(remaining + 30)}>+30s</button>
      <button className="btn btn-ghost btn-sm" onClick={clearTimer}>Pular</button>
    </div>
  )
}

function SubstituteModal({ exercise, onClose, onPick }: {
  exercise: Exercise
  onClose: () => void
  onPick: (id: string, scope: 'today' | 'always') => void
}) {
  const profile = useStore((s) => s.profile)!
  const [chosen, setChosen] = useState<Exercise | null>(null)
  const options = equivalentsFor(exercise.id, profile)

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {!chosen ? (
          <>
            <h2>Trocar {exercise.name}</h2>
            <p className="muted small" style={{ marginTop: 4 }}>Equivalentes com o seu equipamento:</p>
            <div style={{ marginTop: 8 }}>
              {options.length === 0 && <p className="muted small">Nenhum equivalente disponível — você pode pular este exercício.</p>}
              {options.slice(0, 8).map((o) => (
                <button key={o.id} className="list-item" onClick={() => setChosen(o)}>
                  <div className="grow">
                    <h3>{o.name}</h3>
                    <span className="tiny faint">{o.equivGroup === exercise.equivGroup ? 'Mesmo padrão de movimento' : 'Estímulo semelhante'}</span>
                  </div>
                  <span className="chev">›</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2>{chosen.name}</h2>
            <p className="muted small" style={{ marginTop: 4 }}>Aplicar a troca:</p>
            <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => onPick(chosen.id, 'today')}>
              Só neste treino
            </button>
            <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => onPick(chosen.id, 'always')}>
              Sempre (atualiza o plano)
            </button>
            <button className="btn btn-quiet" onClick={() => setChosen(null)}>← Outras opções</button>
          </>
        )}
      </div>
    </div>
  )
}
