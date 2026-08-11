import type {
  Equipment, Exercise, Goal, Limitation, Plan, PlanExercise, SlotType,
  TrainingProfile, WorkoutDay, MuscleGroup,
} from '../types'
import { EXERCISES, MUSCLE_LABEL } from '../data/exercises'

// Gerador semi-determinístico por templates parametrizados (seção 19 da PRODUCT_SPEC).
// Mesmo perfil + mesma seed → mesmo plano. Roda 100% no cliente.

// ---------- RNG com seed ----------
function hashStr(s: string): number {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}
function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------- Templates de divisão ----------
interface SlotSpec { slot: SlotType; optional?: boolean }
interface DayTemplate { label: string; slots: SlotSpec[] }

const FB_A: DayTemplate = { label: 'Corpo inteiro A', slots: [
  { slot: 'knee_comp' }, { slot: 'push_h_comp' }, { slot: 'pull_h_comp' },
  { slot: 'hip_comp' }, { slot: 'iso_ombro_lat', optional: true }, { slot: 'core', optional: true },
] }
const FB_B: DayTemplate = { label: 'Corpo inteiro B', slots: [
  { slot: 'hip_comp' }, { slot: 'push_v_comp' }, { slot: 'pull_v_comp' },
  { slot: 'lower_uni' }, { slot: 'iso_panturrilha', optional: true }, { slot: 'core', optional: true },
] }
const FB_C: DayTemplate = { label: 'Corpo inteiro C', slots: [
  { slot: 'knee_comp' }, { slot: 'push_h_comp' }, { slot: 'pull_h_comp' },
  { slot: 'iso_biceps', optional: true }, { slot: 'iso_triceps', optional: true }, { slot: 'core', optional: true },
] }
const UPPER_A: DayTemplate = { label: 'Superiores A', slots: [
  { slot: 'push_h_comp' }, { slot: 'pull_h_comp' }, { slot: 'push_v_comp' },
  { slot: 'pull_v_comp' }, { slot: 'iso_biceps', optional: true }, { slot: 'iso_triceps', optional: true },
] }
const LOWER_A: DayTemplate = { label: 'Inferiores A', slots: [
  { slot: 'knee_comp' }, { slot: 'hip_comp' }, { slot: 'lower_uni' },
  { slot: 'iso_panturrilha' }, { slot: 'core', optional: true },
] }
const UPPER_B: DayTemplate = { label: 'Superiores B', slots: [
  { slot: 'push_v_comp' }, { slot: 'pull_v_comp' }, { slot: 'push_h_comp' },
  { slot: 'iso_ombro_lat' }, { slot: 'iso_ombro_post', optional: true }, { slot: 'iso_biceps', optional: true },
] }
const LOWER_B: DayTemplate = { label: 'Inferiores B', slots: [
  { slot: 'hip_comp' }, { slot: 'knee_comp' }, { slot: 'iso_posterior' },
  { slot: 'iso_gluteo' }, { slot: 'iso_panturrilha', optional: true }, { slot: 'core', optional: true },
] }
const PUSH: DayTemplate = { label: 'Empurrar (peito/ombro/tríceps)', slots: [
  { slot: 'push_h_comp' }, { slot: 'push_v_comp' }, { slot: 'iso_peito', optional: true },
  { slot: 'iso_ombro_lat' }, { slot: 'iso_triceps' },
] }
const PULL: DayTemplate = { label: 'Puxar (costas/bíceps)', slots: [
  { slot: 'pull_v_comp' }, { slot: 'pull_h_comp' }, { slot: 'iso_ombro_post', optional: true },
  { slot: 'iso_biceps' }, { slot: 'core', optional: true },
] }
const LEGS: DayTemplate = { label: 'Pernas', slots: [
  { slot: 'knee_comp' }, { slot: 'hip_comp' }, { slot: 'lower_uni', optional: true },
  { slot: 'iso_posterior' }, { slot: 'iso_panturrilha' }, { slot: 'core', optional: true },
] }

interface SplitDef { type: string; label: string; days: DayTemplate[] }

function pickSplit(p: TrainingProfile): { split: SplitDef; notes: string[] } {
  const beginner = p.experience === 'none' || p.experience === 'little'
  const notes: string[] = []
  let freq = p.frequency

  // Sem equipamento algum, divisões por grupo ficam inviáveis (não há como isolar
  // padrões com peso corporal) → corpo inteiro sempre, com ciclo rotativo.
  if (p.location === 'home_none') {
    if (freq === 2) return { split: { type: 'fullbody_2', label: 'Corpo inteiro 2x', days: [FB_A, FB_B] }, notes }
    if (freq > 3)
      notes.push(
        `Sem equipamentos, treinos de corpo inteiro rendem mais que divisões por músculo. Montamos o ciclo A→B→C — treine nos ${freq} dias que planejou repetindo o ciclo.`,
      )
    return { split: { type: 'fullbody_3', label: 'Corpo inteiro (ciclo A/B/C)', days: [FB_A, FB_B, FB_C] }, notes }
  }

  if (freq >= 5 && beginner) {
    notes.push(
      `Você pediu ${freq} dias, mas para quem está começando, 4 treinos bem executados + descanso rendem mais que ${freq}. Montamos 4 dias — quando evoluir, é só ajustar no Perfil.`,
    )
    freq = 4
  }

  if (freq === 2) return { split: { type: 'fullbody_2', label: 'Corpo inteiro 2x', days: [FB_A, FB_B] }, notes }
  if (freq === 3) {
    if (beginner || p.sessionTimeMin <= 45)
      return { split: { type: 'fullbody_3', label: 'Corpo inteiro 3x', days: [FB_A, FB_B, FB_C] }, notes }
    return { split: { type: 'ppl_3', label: 'Empurrar / Puxar / Pernas', days: [PUSH, PULL, LEGS] }, notes }
  }
  if (freq === 4)
    return { split: { type: 'ul_4', label: 'Superiores / Inferiores', days: [UPPER_A, LOWER_A, UPPER_B, LOWER_B] }, notes }
  if (freq === 5)
    return {
      split: {
        type: 'ul_fb_5', label: 'Superiores / Inferiores + Corpo inteiro',
        days: [UPPER_A, LOWER_A, UPPER_B, LOWER_B, FB_A],
      }, notes,
    }
  // 6
  return {
    split: {
      type: 'ppl_6', label: 'Empurrar / Puxar / Pernas ×2',
      days: [
        PUSH, PULL, LEGS,
        { ...PUSH, label: 'Empurrar B' }, { ...PULL, label: 'Puxar B' }, { ...LEGS, label: 'Pernas B' },
      ],
    }, notes,
  }
}

// ---------- Equipamento disponível ----------
const ALL_EQUIP: Equipment[] = ['halteres', 'barra', 'banco', 'elasticos', 'barra_fixa', 'kettlebell', 'maquinas', 'polia', 'peso_corporal']

export function availableEquipment(p: TrainingProfile): Equipment[] {
  if (p.location === 'gym_full') return ALL_EQUIP
  const set = new Set<Equipment>(p.equipment)
  set.add('peso_corporal')
  return [...set]
}

// ---------- Filtro de candidatos ----------
function maxSkill(p: TrainingProfile): number {
  if (p.experience === 'advanced') return 3
  if (p.experience === 'intermediate') return 2
  if (p.experience === 'little') return 2
  return 1
}

export function canPerform(ex: Exercise, equip: Equipment[], limitations: Limitation[]): boolean {
  const eqOk = ex.equipment.every((e) => equip.includes(e))
  const limOk = !ex.contraindications.some((c) => limitations.includes(c))
  return eqOk && limOk
}

function candidatesFor(slot: SlotType, p: TrainingProfile, equip: Equipment[]): Exercise[] {
  // Se o teto de habilidade zera o slot (ex.: pike push-up para iniciante em casa),
  // relaxa o teto antes de deixar o slot vazio — slot vazio é pior que exercício exigente.
  for (let cap = maxSkill(p); cap <= 3; cap++) {
    const found = EXERCISES.filter(
      (ex) => ex.slotTypes.includes(slot) && ex.skill <= cap && canPerform(ex, equip, p.limitations),
    ).sort((a, b) => a.equivRank - b.equivRank)
    if (found.length > 0) return found
  }
  return []
}

// ---------- Prescrição ----------
interface Rx { repMin: number; repMax: number; rest: number }
function prescribe(goal: Goal, slot: SlotType, loadType: Exercise['loadType']): Rx {
  const compound = slot.endsWith('_comp') || slot === 'lower_uni'
  if (loadType !== 'external') {
    // Peso corporal / elástico: progressão por repetições — faixa mais larga.
    return compound ? { repMin: 8, repMax: 15, rest: compound ? 90 : 60 } : { repMin: 12, repMax: 20, rest: 60 }
  }
  switch (goal) {
    case 'strength':
      return compound ? { repMin: 4, repMax: 6, rest: 165 } : { repMin: 8, repMax: 12, rest: 90 }
    case 'fat_loss':
      return compound ? { repMin: 8, repMax: 12, rest: 90 } : { repMin: 12, repMax: 15, rest: 60 }
    case 'hypertrophy':
      return compound ? { repMin: 6, repMax: 10, rest: 120 } : { repMin: 10, repMax: 15, rest: 60 }
    default: // health, return_fitness
      return compound ? { repMin: 8, repMax: 12, rest: 90 } : { repMin: 10, repMax: 15, rest: 60 }
  }
}

function baseSets(p: TrainingProfile, slot: SlotType): number {
  const compound = slot.endsWith('_comp') || slot === 'lower_uni'
  const beginner = p.experience === 'none' || p.experience === 'little'
  let sets = compound ? 3 : beginner ? 2 : 3
  if (p.experience === 'advanced' && compound) sets = 4
  const returning = p.currentState === 'paused_months' || p.currentState === 'paused_long'
  if (returning) sets = Math.max(2, Math.round(sets * 0.7)) // rampa de recomeço (ciclo 1)
  return sets
}

// ---------- Estimativa de duração ----------
const SET_EXEC_SEC = 40
const SETUP_SEC = 60
const WARMUP_SEC = 300
export function estimateDayMin(exs: PlanExercise[]): number {
  const s = exs.reduce((acc, e) => acc + e.sets * (SET_EXEC_SEC + e.restSec) + SETUP_SEC, WARMUP_SEC)
  return Math.round(s / 60)
}

// ---------- Racional ----------
const GOAL_LABEL: Record<Goal, string> = {
  hypertrophy: 'ganhar massa muscular',
  fat_loss: 'perder gordura preservando músculo',
  strength: 'ficar mais forte',
  return_fitness: 'voltar à forma',
  health: 'saúde e disposição',
}
const LOC_LABEL: Record<TrainingProfile['location'], string> = {
  gym_full: 'academia completa',
  gym_basic: 'academia básica',
  home_equipment: 'casa com equipamentos',
  home_none: 'casa sem equipamentos',
}

function buildRationale(p: TrainingProfile, splitLabel: string, dayCount: number): string[] {
  const r: string[] = []
  r.push(`Objetivo "${GOAL_LABEL[p.goal]}" → faixas de repetições e descansos calibrados para isso.`)
  r.push(`${dayCount} dias/semana → divisão ${splitLabel}: cada músculo é estimulado com frequência e recuperação adequadas.`)
  r.push(`Local: ${LOC_LABEL[p.location]} → todos os exercícios usam apenas o que você tem disponível.`)
  if (p.sessionTimeMin <= 45) r.push(`Sessões de ~${p.sessionTimeMin} min → priorizamos os exercícios de maior retorno e cortamos o supérfluo.`)
  if (p.limitations.length > 0) r.push('Suas limitações foram respeitadas: excluímos os padrões de maior estresse nessas regiões.')
  if (p.currentState === 'paused_months' || p.currentState === 'paused_long')
    r.push('Você está voltando de uma pausa → volume inicial reduzido (~30% a menos) para readaptar sem dor excessiva. Sobe no próximo ciclo.')
  return r
}

// ---------- Geração ----------
export function generatePlan(p: TrainingProfile, seed: string): Plan {
  const rng = mulberry32(hashStr(seed + JSON.stringify([p.goal, p.frequency, p.location, p.experience])))
  const { split, notes } = pickSplit(p)
  const equip = availableEquipment(p)
  const usedInPlan = new Map<string, number>() // exerciseId → nº de dias em que já aparece
  let trimmed = false // cortes de tempo além dos opcionais → avisar com transparência

  const days: WorkoutDay[] = split.days.map((tpl, di) => {
    const usedGroupsToday = new Set<string>()
    const exercises: PlanExercise[] = []

    for (const spec of tpl.slots) {
      const cands = candidatesFor(spec.slot, p, equip)
      if (cands.length === 0) continue // sem opção viável → slot sai (nunca prescrever o impossível)

      // Com carga externa disponível, elástico não entra na prescrição principal
      // (fica acessível via substituição) — qualidade percebida da prescrição.
      const hasExternal = cands.some((c) => c.loadType === 'external')
      const graded = hasExternal ? cands.filter((c) => c.loadType !== 'band') : cands

      // Evita repetir família no mesmo dia; espalha variedade entre dias.
      const fresh = graded.filter((c) => !usedGroupsToday.has(c.equivGroup))
      const pool = fresh.length > 0 ? fresh : graded
      const minUse = Math.min(...pool.map((c) => usedInPlan.get(c.id) ?? 0))
      const leastUsed = pool.filter((c) => (usedInPlan.get(c.id) ?? 0) === minUse)
      // Desempate por seed apenas entre opções de rank vizinho (variação sem perda de qualidade).
      const bestRank = leastUsed[0].equivRank
      const top = leastUsed.filter((c) => c.equivRank <= bestRank + 1).slice(0, 2)
      const chosen = top[Math.floor(rng() * top.length)]

      usedGroupsToday.add(chosen.equivGroup)
      usedInPlan.set(chosen.id, (usedInPlan.get(chosen.id) ?? 0) + 1)

      const rx = prescribe(p.goal, spec.slot, chosen.loadType)
      exercises.push({
        id: crypto.randomUUID(),
        exerciseId: chosen.id,
        slotType: spec.slot,
        sets: baseSets(p, spec.slot),
        repMin: rx.repMin,
        repMax: rx.repMax,
        restSec: rx.rest,
        optional: spec.optional ?? false,
      })
    }

    // Ajuste ao tempo — escada de cortes (estágio 5 da spec), do menos ao mais invasivo:
    // opcionais → séries de acessórios → descansos → acessórios do fim → séries de compostos → compostos do fim.
    const isComp = (e: PlanExercise) => e.slotType.endsWith('_comp') || e.slotType === 'lower_uni'
    const budget = p.sessionTimeMin
    let est = estimateDayMin(exercises)

    while (est > budget && exercises.some((e) => e.optional)) {
      exercises.splice(exercises.map((e) => e.optional).lastIndexOf(true), 1)
      est = estimateDayMin(exercises)
    }
    if (est > budget) {
      for (const e of exercises) if (!isComp(e) && e.sets > 2) e.sets = 2
      est = estimateDayMin(exercises)
    }
    if (est > budget) {
      for (const e of exercises) e.restSec = Math.min(e.restSec, isComp(e) ? 90 : 45)
      est = estimateDayMin(exercises)
      trimmed = true
    }
    while (est > budget && exercises.filter((e) => !isComp(e)).length > 0 && exercises.length > 3) {
      const idx = exercises.map(isComp).lastIndexOf(false)
      exercises.splice(idx, 1)
      est = estimateDayMin(exercises)
      trimmed = true
    }
    if (est > budget) {
      for (const e of exercises) if (isComp(e) && e.sets > 3) e.sets = 3
      est = estimateDayMin(exercises)
    }
    while (est > budget && exercises.length > 3) {
      exercises.splice(exercises.length - 1, 1)
      est = estimateDayMin(exercises)
      trimmed = true
    }

    const muscles = [...new Set(exercises.map((e) => {
      const ex = EXERCISES.find((x) => x.id === e.exerciseId)!
      return ex.primary
    }))] as MuscleGroup[]

    return {
      id: crypto.randomUUID(),
      label: tpl.label,
      position: di,
      targetMuscles: muscles,
      estMin: est,
      exercises,
    }
  })

  if (trimmed)
    notes.push(
      `Para caber em ~${p.sessionTimeMin} min, enxugamos descansos e acessórios. Se puder treinar por mais tempo, ajuste em Perfil → Ajustar plano.`,
    )

  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    splitType: split.type,
    splitLabel: split.label,
    rationale: buildRationale(p, split.label, days.length),
    notes,
    days,
    profileSnapshot: { ...p },
    status: 'active',
  }
}

// ---------- Substituição ----------
export function equivalentsFor(exerciseId: string, p: TrainingProfile): Exercise[] {
  const base = EXERCISES.find((e) => e.id === exerciseId)
  if (!base) return []
  const equip = availableEquipment(p)
  return EXERCISES.filter(
    (e) =>
      e.id !== base.id &&
      (e.equivGroup === base.equivGroup || e.slotTypes.some((s) => base.slotTypes.includes(s))) &&
      canPerform(e, equip, p.limitations),
  ).sort((a, b) => {
    const aSame = a.equivGroup === base.equivGroup ? 0 : 1
    const bSame = b.equivGroup === base.equivGroup ? 0 : 1
    return aSame - bSame || a.equivRank - b.equivRank
  })
}

export { MUSCLE_LABEL }
