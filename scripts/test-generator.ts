// Teste combinatório do gerador (seção 36 da PRODUCT_SPEC):
// toda combinação válida gera plano; nenhum exercício fora do equipamento;
// nenhuma contraindicação violada; duração ≤ tempo declarado + 15%.
// Rodar: npx tsx scripts/test-generator.ts

import { generatePlan, availableEquipment, canPerform } from '../src/lib/generator'
import { byId } from '../src/data/exercises'
import type { Equipment, Experience, Goal, Limitation, TrainLocation, TrainingProfile } from '../src/types'

// polyfill p/ Node sem DOM
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  const { randomUUID } = await import('node:crypto')
  ;(globalThis as any).crypto = { randomUUID }
}

const goals: Goal[] = ['hypertrophy', 'fat_loss', 'strength', 'return_fitness', 'health']
const exps: Experience[] = ['none', 'little', 'intermediate', 'advanced']
const states = ['active', 'sometimes', 'paused_months', 'paused_long'] as const
const locs: { loc: TrainLocation; eq: Equipment[] }[] = [
  { loc: 'gym_full', eq: [] },
  { loc: 'gym_basic', eq: ['halteres', 'banco', 'polia'] },
  { loc: 'home_equipment', eq: ['halteres', 'elasticos'] },
  { loc: 'home_equipment', eq: ['elasticos'] },
  { loc: 'home_none', eq: [] },
]
const freqs = [2, 3, 4, 5, 6]
const times = [30, 45, 60, 75]
const limSets: Limitation[][] = [[], ['joelho'], ['lombar'], ['ombro'], ['punho'], ['joelho', 'lombar'], ['ombro', 'punho']]

let count = 0
let fails = 0
const problems: string[] = []

for (const goal of goals)
  for (const experience of exps)
    for (const currentState of states)
      for (const { loc, eq } of locs)
        for (const frequency of freqs)
          for (const sessionTimeMin of times)
            for (const limitations of limSets) {
              const p: TrainingProfile = {
                goal, experience, currentState, location: loc, equipment: eq,
                frequency, sessionTimeMin, limitations,
                biometrics: { age: 30 }, version: 1,
              }
              count++
              try {
                const plan = generatePlan(p, 'test-seed')
                if (plan.days.length === 0) throw new Error('plano sem dias')
                const equip = availableEquipment(p)
                for (const day of plan.days) {
                  if (day.exercises.length < 3) throw new Error(`dia "${day.label}" com só ${day.exercises.length} exercícios`)
                  if (day.estMin > sessionTimeMin * 1.15) throw new Error(`dia "${day.label}" estoura tempo: ${day.estMin} > ${sessionTimeMin}+15%`)
                  for (const pe of day.exercises) {
                    const ex = byId.get(pe.exerciseId)
                    if (!ex) throw new Error(`exercício inexistente ${pe.exerciseId}`)
                    if (!canPerform(ex, equip, limitations))
                      throw new Error(`"${ex.name}" viola equipamento/limitação (${loc}, lims=${limitations.join(',')})`)
                    if (pe.sets < 2 || pe.repMin >= pe.repMax) throw new Error(`prescrição inválida em "${ex.name}"`)
                  }
                }
                // determinismo
                const again = generatePlan(p, 'test-seed')
                const sig = (pl: typeof plan) => pl.days.map((d) => d.exercises.map((e) => e.exerciseId).join(',')).join('|')
                if (sig(plan) !== sig(again)) throw new Error('não determinístico')
              } catch (e: any) {
                fails++
                const key = `${goal}/${experience}/${currentState}/${loc}[${eq.join('+')}]/f${frequency}/t${sessionTimeMin}/lim=${limitations.join(',')}: ${e.message}`
                if (problems.length < 20 && !problems.some((x) => x.endsWith(e.message))) problems.push(key)
              }
            }

console.log(`\n${count} combinações testadas · ${fails} falhas`)
if (problems.length) {
  console.log('\nAmostra de problemas:')
  for (const p of problems) console.log(' ✗', p)
  process.exit(1)
}
console.log('✓ Todos os planos válidos: equipamento respeitado, limitações respeitadas, tempo dentro do orçamento, geração determinística.')
