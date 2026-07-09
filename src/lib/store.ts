import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  OnboardingDraft, Plan, PRRecord, Session, SessionExercise, SetLog, TrainingProfile,
} from '../types'
import { generatePlan } from './generator'
import { checkPR } from './progression'
import { byId } from '../data/exercises'

// Persistência write-through: o middleware `persist` grava em localStorage a cada `set`,
// antes do próximo frame — princípio 1 da spec (nunca perder uma série logada).

const RESUME_WINDOW_MS = 8 * 60 * 60 * 1000 // 8h (seção 21)

interface WinfitState {
  seed: string
  profile: TrainingProfile | null
  draft: OnboardingDraft | null
  plan: Plan | null
  archivedPlans: Plan[]
  sessions: Session[] // encerradas (completed | partial)
  activeSession: Session | null
  prs: PRRecord[]

  setDraft: (d: OnboardingDraft | null) => void
  completeOnboarding: (p: TrainingProfile) => void
  activatePlan: () => void
  regenerate: (p: TrainingProfile) => void

  startSession: (dayId: string) => void
  resumeOrExpireSession: () => 'none' | 'resumable' | 'expired'
  saveExpiredAsPartial: () => void
  discardActive: () => void
  logSet: (exerciseIdx: number, weight: number, reps: number) => SetLog | null
  editSet: (logId: string, weight: number, reps: number) => void
  deleteSet: (logId: string) => void
  substitute: (exerciseIdx: number, newExerciseId: string, scope: 'today' | 'always') => void
  skipExercise: (exerciseIdx: number) => void
  setCurrentIndex: (i: number) => void
  clearTimer: () => void
  startTimer: (sec: number) => void
  finishSession: (rpe?: number) => string | null

  exportData: () => string
  resetAll: () => void
}

function sessionFromDay(plan: Plan, dayId: string): Session | null {
  const day = plan.days.find((d) => d.id === dayId)
  if (!day) return null
  const exercises: SessionExercise[] = day.exercises.map((pe) => ({
    planExerciseId: pe.id,
    exerciseId: pe.exerciseId,
    sets: pe.sets,
    repMin: pe.repMin,
    repMax: pe.repMax,
    restSec: pe.restSec,
    optional: pe.optional,
    skipped: false,
  }))
  return {
    id: crypto.randomUUID(),
    planId: plan.id,
    dayId: day.id,
    dayLabel: day.label,
    startedAt: Date.now(),
    status: 'active',
    exercises,
    logs: [],
    currentIndex: 0,
    timer: null,
  }
}

export const useStore = create<WinfitState>()(
  persist(
    (set, get) => ({
      seed: crypto.randomUUID(),
      profile: null,
      draft: null,
      plan: null,
      archivedPlans: [],
      sessions: [],
      activeSession: null,
      prs: [],

      setDraft: (d) => set({ draft: d }),

      completeOnboarding: (p) => {
        const plan = generatePlan(p, get().seed)
        set({ profile: p, plan, draft: null })
      },

      activatePlan: () => {
        const { plan } = get()
        if (plan) set({ plan: { ...plan, status: 'active' } })
      },

      regenerate: (p) => {
        const { plan, archivedPlans, seed } = get()
        const next = generatePlan(p, seed + ':' + Date.now())
        set({
          profile: p,
          plan: next,
          archivedPlans: plan ? [{ ...plan, status: 'archived' as const }, ...archivedPlans].slice(0, 10) : archivedPlans,
        })
      },

      startSession: (dayId) => {
        const { plan } = get()
        if (!plan) return
        const s = sessionFromDay(plan, dayId)
        if (s) set({ activeSession: s })
      },

      resumeOrExpireSession: () => {
        const s = get().activeSession
        if (!s) return 'none'
        const lastTs = s.logs.length > 0 ? Math.max(...s.logs.map((l) => l.ts)) : s.startedAt
        return Date.now() - lastTs < RESUME_WINDOW_MS ? 'resumable' : 'expired'
      },

      saveExpiredAsPartial: () => {
        const s = get().activeSession
        if (!s) return
        if (s.logs.length === 0) {
          set({ activeSession: null })
          return
        }
        const done: Session = { ...s, status: 'partial', endedAt: Date.now(), timer: null }
        set({ activeSession: null, sessions: [done, ...get().sessions] })
      },

      discardActive: () => set({ activeSession: null }),

      logSet: (exerciseIdx, weight, reps) => {
        const { activeSession, sessions } = get()
        if (!activeSession) return null
        const ex = activeSession.exercises[exerciseIdx]
        if (!ex) return null
        const already = activeSession.logs.filter((l) => l.planExerciseId === ex.planExerciseId).length
        const isPR = checkPR(ex.exerciseId, weight, sessions)
        const log: SetLog = {
          id: crypto.randomUUID(),
          exerciseId: ex.exerciseId,
          planExerciseId: ex.planExerciseId,
          setNumber: already + 1,
          weight,
          reps,
          ts: Date.now(),
          isPR,
        }
        set({
          activeSession: {
            ...activeSession,
            logs: [...activeSession.logs, log],
            timer: { endsAt: Date.now() + ex.restSec * 1000, totalSec: ex.restSec },
          },
        })
        return log
      },

      editSet: (logId, weight, reps) => {
        const s = get().activeSession
        if (!s) return
        set({
          activeSession: {
            ...s,
            logs: s.logs.map((l) => (l.id === logId ? { ...l, weight, reps } : l)),
          },
        })
      },

      deleteSet: (logId) => {
        const s = get().activeSession
        if (!s) return
        set({ activeSession: { ...s, logs: s.logs.filter((l) => l.id !== logId) } })
      },

      substitute: (exerciseIdx, newExerciseId, scope) => {
        const { activeSession, plan } = get()
        if (!activeSession || !byId.has(newExerciseId)) return
        const cur = activeSession.exercises[exerciseIdx]
        const exercises = activeSession.exercises.map((e, i) =>
          i === exerciseIdx ? { ...e, exerciseId: newExerciseId, substitutedFrom: cur.exerciseId } : e,
        )
        let nextPlan = plan
        if (scope === 'always' && plan) {
          nextPlan = {
            ...plan,
            days: plan.days.map((d) => ({
              ...d,
              exercises: d.exercises.map((pe) =>
                pe.id === cur.planExerciseId ? { ...pe, exerciseId: newExerciseId } : pe,
              ),
            })),
          }
        }
        set({ activeSession: { ...activeSession, exercises }, plan: nextPlan })
      },

      skipExercise: (exerciseIdx) => {
        const s = get().activeSession
        if (!s) return
        const exercises = s.exercises.map((e, i) => (i === exerciseIdx ? { ...e, skipped: true } : e))
        const next = exercises.findIndex((e, i) => i > exerciseIdx && !e.skipped)
        set({
          activeSession: {
            ...s,
            exercises,
            currentIndex: next >= 0 ? next : Math.min(exerciseIdx + 1, exercises.length - 1),
          },
        })
      },

      setCurrentIndex: (i) => {
        const s = get().activeSession
        if (!s) return
        set({ activeSession: { ...s, currentIndex: i } })
      },

      clearTimer: () => {
        const s = get().activeSession
        if (!s) return
        set({ activeSession: { ...s, timer: null } })
      },

      startTimer: (sec) => {
        const s = get().activeSession
        if (!s) return
        set({ activeSession: { ...s, timer: { endsAt: Date.now() + sec * 1000, totalSec: sec } } })
      },

      finishSession: (rpe) => {
        const { activeSession, sessions, prs } = get()
        if (!activeSession) return null
        if (activeSession.logs.length === 0) {
          set({ activeSession: null })
          return null
        }
        const totalPlanned = activeSession.exercises.filter((e) => !e.skipped).reduce((a, e) => a + e.sets, 0)
        const status = activeSession.logs.length >= totalPlanned ? 'completed' : 'partial'
        const done: Session = { ...activeSession, status, endedAt: Date.now(), timer: null, rpe }
        const newPRs: PRRecord[] = done.logs
          .filter((l) => l.isPR)
          .map((l) => ({
            id: crypto.randomUUID(),
            exerciseId: l.exerciseId,
            type: 'max_weight' as const,
            value: l.weight,
            reps: l.reps,
            ts: l.ts,
            sessionId: done.id,
          }))
        // Mantém só o melhor PR por exercício desta sessão
        const bestByEx = new Map<string, PRRecord>()
        for (const pr of newPRs) {
          const cur = bestByEx.get(pr.exerciseId)
          if (!cur || pr.value > cur.value) bestByEx.set(pr.exerciseId, pr)
        }
        set({
          activeSession: null,
          sessions: [done, ...sessions],
          prs: [...bestByEx.values(), ...prs],
        })
        return done.id
      },

      exportData: () => {
        const { profile, plan, archivedPlans, sessions, prs } = get()
        return JSON.stringify(
          { app: 'winfit', exportedAt: new Date().toISOString(), profile, plan, archivedPlans, sessions, prs },
          null,
          2,
        )
      },

      resetAll: () =>
        set({
          profile: null, draft: null, plan: null, archivedPlans: [],
          sessions: [], activeSession: null, prs: [],
        }),
    }),
    {
      name: 'winfit-v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
