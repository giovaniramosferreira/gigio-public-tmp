// Domínio do WinFit — espelha a seção 33 da PRODUCT_SPEC.md (subconjunto do MVP web local-first)

export type Goal = 'hypertrophy' | 'fat_loss' | 'strength' | 'return_fitness' | 'health'
export type Experience = 'none' | 'little' | 'intermediate' | 'advanced'
export type CurrentState = 'active' | 'sometimes' | 'paused_months' | 'paused_long'
export type TrainLocation = 'gym_full' | 'gym_basic' | 'home_equipment' | 'home_none'

export type Equipment =
  | 'halteres'
  | 'barra'
  | 'banco'
  | 'elasticos'
  | 'barra_fixa'
  | 'kettlebell'
  | 'maquinas'
  | 'polia'
  | 'peso_corporal'

export type Limitation = 'joelho' | 'lombar' | 'ombro' | 'punho'

export type MuscleGroup =
  | 'peito'
  | 'costas'
  | 'ombro'
  | 'biceps'
  | 'triceps'
  | 'quadriceps'
  | 'posterior'
  | 'gluteo'
  | 'panturrilha'
  | 'core'

export type SlotType =
  | 'push_h_comp'
  | 'push_v_comp'
  | 'pull_h_comp'
  | 'pull_v_comp'
  | 'knee_comp'
  | 'hip_comp'
  | 'lower_uni'
  | 'iso_peito'
  | 'iso_ombro_lat'
  | 'iso_ombro_post'
  | 'iso_biceps'
  | 'iso_triceps'
  | 'iso_posterior'
  | 'iso_quad'
  | 'iso_gluteo'
  | 'iso_panturrilha'
  | 'core'

export interface Biometrics {
  sex?: 'f' | 'm' | 'na'
  age?: number
  weightKg?: number
  heightCm?: number
}

export interface TrainingProfile {
  goal: Goal
  experience: Experience
  currentState: CurrentState
  location: TrainLocation
  equipment: Equipment[]
  frequency: number // 2..6
  sessionTimeMin: number // 30 | 45 | 60 | 75
  limitations: Limitation[]
  biometrics: Biometrics
  version: number
}

export interface Exercise {
  id: string
  name: string
  aliases: string[]
  slotTypes: SlotType[]
  primary: MuscleGroup
  secondary: MuscleGroup[]
  equipment: Equipment[] // AND — tudo necessário
  skill: 1 | 2 | 3
  loadType: 'external' | 'bodyweight' | 'band'
  minIncrementKg: number
  contraindications: Limitation[]
  instructions: string[]
  mistakes: string[]
  equivGroup: string
  equivRank: number
}

export interface PlanExercise {
  id: string
  exerciseId: string
  slotType: SlotType
  sets: number
  repMin: number
  repMax: number
  restSec: number
  optional: boolean
}

export interface WorkoutDay {
  id: string
  label: string
  position: number
  targetMuscles: MuscleGroup[]
  estMin: number
  exercises: PlanExercise[]
}

export interface Plan {
  id: string
  createdAt: number
  splitType: string
  splitLabel: string
  rationale: string[]
  notes: string[]
  days: WorkoutDay[]
  profileSnapshot: TrainingProfile
  status: 'active' | 'archived'
}

export interface SetLog {
  id: string
  exerciseId: string
  planExerciseId: string
  setNumber: number
  weight: number // 0 = peso corporal
  reps: number
  ts: number
  isPR: boolean
}

export interface SessionExercise {
  planExerciseId: string
  exerciseId: string
  sets: number
  repMin: number
  repMax: number
  restSec: number
  optional: boolean
  skipped: boolean
  substitutedFrom?: string
}

export interface RestTimer {
  endsAt: number
  totalSec: number
}

export interface Session {
  id: string
  planId: string
  dayId: string
  dayLabel: string
  startedAt: number
  endedAt?: number
  status: 'active' | 'completed' | 'partial' | 'discarded'
  exercises: SessionExercise[]
  logs: SetLog[]
  currentIndex: number
  timer: RestTimer | null
  rpe?: number
}

export interface PRRecord {
  id: string
  exerciseId: string
  type: 'max_weight' | 'e1rm'
  value: number
  reps: number
  ts: number
  sessionId: string
}

export interface OnboardingDraft {
  step: number
  goal?: Goal
  experience?: Experience
  currentState?: CurrentState
  location?: TrainLocation
  equipment?: Equipment[]
  frequency?: number
  sessionTimeMin?: number
  limitations?: Limitation[]
  biometrics?: Biometrics
}
