import type { Exercise, PlanExercise, Session, SetLog } from '../types'

// Dupla progressão (seção 19 da spec): fechou todas as séries no teto da faixa → sobe carga,
// volta ao piso. Senão → mesma carga, meta é adicionar repetições.

export interface Suggestion {
  weight: number | null // null = primeira vez: calibrar
  targetReps: number
  note: string
  isIncrease: boolean
}

/** Últimos sets não-extra de um exercício na sessão mais recente que o contém. */
export function lastPerformance(exerciseId: string, sessions: Session[]): SetLog[] | null {
  const done = sessions
    .filter((s) => (s.status === 'completed' || s.status === 'partial') && s.logs.some((l) => l.exerciseId === exerciseId))
    .sort((a, b) => b.startedAt - a.startedAt)
  if (done.length === 0) return null
  return done[0].logs.filter((l) => l.exerciseId === exerciseId)
}

export function sessionsWithExercise(exerciseId: string, sessions: Session[]): number {
  return sessions.filter(
    (s) => (s.status === 'completed' || s.status === 'partial') && s.logs.some((l) => l.exerciseId === exerciseId),
  ).length
}

export function suggestFor(planEx: PlanExercise, exercise: Exercise, sessions: Session[]): Suggestion {
  const last = lastPerformance(planEx.exerciseId, sessions)
  if (!last || last.length === 0) {
    return {
      weight: null,
      targetReps: planEx.repMax,
      note:
        exercise.loadType === 'external'
          ? 'Primeira vez: encontre um peso que desafie nas últimas 2 repetições.'
          : 'Primeira vez: registre quantas repetições consegue com boa execução.',
      isIncrease: false,
    }
  }
  const maxWeight = Math.max(...last.map((l) => l.weight))
  const allTopped = last.every((l) => l.reps >= planEx.repMax)

  if (exercise.loadType !== 'external') {
    if (allTopped) {
      return { weight: 0, targetReps: planEx.repMax, note: 'Você fechou a faixa — hora de progredir para uma variação mais difícil (troque o exercício).', isIncrease: true }
    }
    const best = Math.max(...last.map((l) => l.reps))
    return { weight: maxWeight, targetReps: Math.min(best + 1, planEx.repMax), note: `Última vez: ${best} reps. Meta: +1.`, isIncrease: false }
  }

  if (allTopped && maxWeight > 0) {
    const next = round25(maxWeight + exercise.minIncrementKg)
    return { weight: next, targetReps: planEx.repMin, note: `Você fechou ${planEx.sets}×${planEx.repMax} com ${fmtKg(maxWeight)}. Sobe para ${fmtKg(next)}.`, isIncrease: true }
  }
  const bestReps = Math.max(...last.map((l) => l.reps))
  return {
    weight: maxWeight,
    targetReps: Math.min(bestReps + 1, planEx.repMax),
    note: `Última vez: ${fmtKg(maxWeight)} × ${bestReps}. Meta: chegar a ${planEx.repMax} reps.`,
    isIncrease: false,
  }
}

/** PR de carga: peso acima de qualquer registro anterior, apenas a partir da 2ª sessão do exercício. */
export function checkPR(exerciseId: string, weight: number, sessions: Session[]): boolean {
  if (weight <= 0) return false
  const count = sessionsWithExercise(exerciseId, sessions)
  if (count < 1) return false // primeira sessão do exercício = baseline, não PR
  const prevMax = Math.max(
    0,
    ...sessions
      .filter((s) => s.status === 'completed' || s.status === 'partial')
      .flatMap((s) => s.logs.filter((l) => l.exerciseId === exerciseId).map((l) => l.weight)),
  )
  return weight > prevMax
}

export function e1rm(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}

export function maxWeightFor(exerciseId: string, sessions: Session[]): number {
  return Math.max(
    0,
    ...sessions
      .filter((s) => s.status === 'completed' || s.status === 'partial')
      .flatMap((s) => s.logs.filter((l) => l.exerciseId === exerciseId).map((l) => l.weight)),
  )
}

export function round25(x: number): number {
  return Math.round(x / 2.5) * 2.5
}

export function fmtKg(x: number): string {
  return `${x % 1 === 0 ? x : x.toFixed(1).replace('.', ',')} kg`
}

export function volumeOf(logs: SetLog[]): number {
  return logs.reduce((a, l) => a + l.weight * l.reps, 0)
}
