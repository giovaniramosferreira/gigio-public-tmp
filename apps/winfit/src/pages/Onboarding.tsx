import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import type {
  CurrentState, Equipment, Experience, Goal, Limitation, OnboardingDraft, TrainLocation, TrainingProfile,
} from '../types'

const GOALS: { v: Goal; ic: string; t: string; s: string }[] = [
  { v: 'hypertrophy', ic: '💪', t: 'Ganhar músculo', s: 'Hipertrofia como prioridade' },
  { v: 'fat_loss', ic: '🔥', t: 'Perder gordura', s: 'Emagrecer preservando músculo' },
  { v: 'strength', ic: '🏋️', t: 'Ficar mais forte', s: 'Foco em força nos básicos' },
  { v: 'return_fitness', ic: '🔄', t: 'Voltar à forma', s: 'Retomar o condicionamento' },
  { v: 'health', ic: '❤️', t: 'Saúde e disposição', s: 'Treinar bem, viver melhor' },
]
const EXP: { v: Experience; t: string; s: string }[] = [
  { v: 'none', t: 'Nunca treinei', s: 'Ou treinei muito pouco' },
  { v: 'little', t: 'Já treinei um pouco', s: 'Conheço o básico dos exercícios' },
  { v: 'intermediate', t: 'Treino há 6 meses a 2 anos', s: 'Tenho prática regular' },
  { v: 'advanced', t: 'Treino há mais de 2 anos', s: 'Experiência sólida' },
]
const STATE: { v: CurrentState; t: string; s: string }[] = [
  { v: 'active', t: 'Treinando regularmente', s: 'Estou em ritmo' },
  { v: 'sometimes', t: 'Treinando às vezes', s: 'Sem constância' },
  { v: 'paused_months', t: 'Parado há alguns meses', s: 'Voltando de uma pausa' },
  { v: 'paused_long', t: 'Parado há muito tempo', s: '1 ano ou mais' },
]
const LOCATIONS: { v: TrainLocation; ic: string; t: string; s: string }[] = [
  { v: 'gym_full', ic: '🏢', t: 'Academia completa', s: 'Máquinas, pesos livres, polias' },
  { v: 'gym_basic', ic: '🏠', t: 'Academia básica / condomínio', s: 'Estrutura limitada' },
  { v: 'home_equipment', ic: '🧰', t: 'Em casa, com equipamentos', s: 'Halteres, elásticos etc.' },
  { v: 'home_none', ic: '🧘', t: 'Em casa, sem equipamentos', s: 'Só o peso do corpo' },
]
const EQUIP_OPTS: { v: Equipment; t: string }[] = [
  { v: 'halteres', t: 'Halteres' },
  { v: 'barra', t: 'Barra e anilhas' },
  { v: 'banco', t: 'Banco' },
  { v: 'elasticos', t: 'Elásticos' },
  { v: 'barra_fixa', t: 'Barra fixa' },
  { v: 'kettlebell', t: 'Kettlebell' },
  { v: 'maquinas', t: 'Máquinas' },
  { v: 'polia', t: 'Polia / crossover' },
]
const FREQS = [2, 3, 4, 5, 6]
const TIMES = [
  { v: 30, t: 'Até 30 min' },
  { v: 45, t: '~45 min' },
  { v: 60, t: '~60 min' },
  { v: 75, t: '75 min ou mais' },
]
const LIMS: { v: Limitation; t: string }[] = [
  { v: 'joelho', t: 'Joelho' },
  { v: 'lombar', t: 'Lombar' },
  { v: 'ombro', t: 'Ombro' },
  { v: 'punho', t: 'Punho' },
]

export default function Onboarding() {
  const nav = useNavigate()
  const draft = useStore((s) => s.draft)
  const setDraft = useStore((s) => s.setDraft)
  const complete = useStore((s) => s.completeOnboarding)
  const [d, setD] = useState<OnboardingDraft>(draft ?? { step: 1 })
  const [age, setAge] = useState(d.biometrics?.age?.toString() ?? '')
  const [weight, setWeight] = useState(d.biometrics?.weightKg?.toString() ?? '')

  // Persistência do rascunho a cada mudança — fechar e voltar retoma no mesmo passo.
  useEffect(() => { setDraft(d) }, [d, setDraft])

  const needsEquipStep = d.location === 'gym_basic' || d.location === 'home_equipment'
  const totalSteps = 9

  const next = (patch: Partial<OnboardingDraft>, jump = 1) => {
    setTimeout(() => setD((cur) => ({ ...cur, ...patch, step: cur.step + jump })), 180)
  }

  const back = () => {
    if (d.step === 1) return nav('/')
    let jump = 1
    if (d.step === 6 && !needsEquipStep) jump = 2
    setD({ ...d, step: d.step - jump })
  }

  const finish = () => {
    const profile: TrainingProfile = {
      goal: d.goal!,
      experience: d.experience!,
      currentState: d.currentState!,
      location: d.location!,
      equipment: d.location === 'gym_full' ? [] : d.equipment ?? [],
      frequency: d.frequency!,
      sessionTimeMin: d.sessionTimeMin!,
      limitations: d.limitations ?? [],
      biometrics: {
        age: age ? Number(age) : undefined,
        weightKg: weight ? Number(weight) : undefined,
        sex: d.biometrics?.sex,
      },
      version: 1,
    }
    complete(profile)
    nav('/preview')
  }

  const toggleArr = <T,>(arr: T[] | undefined, v: T): T[] => {
    const a = arr ?? []
    return a.includes(v) ? a.filter((x) => x !== v) : [...a, v]
  }

  return (
    <div className="page-full fade-in" key={d.step}>
      <div className="between" style={{ marginBottom: 8 }}>
        <button className="btn-quiet" onClick={back} style={{ padding: '8px 0' }}>← Voltar</button>
        <span className="tiny faint num">{d.step} de {totalSteps}</span>
      </div>
      <div className="progressbar"><div style={{ width: `${(d.step / totalSteps) * 100}%` }} /></div>

      {d.step === 1 && (
        <Step title="Qual seu objetivo principal?">
          {GOALS.map((o) => (
            <button key={o.v} className={`option ${d.goal === o.v ? 'selected' : ''}`}
              onClick={() => next({ goal: o.v })}>
              <span className="icon">{o.ic}</span>
              <span>{o.t}<div className="desc">{o.s}</div></span>
            </button>
          ))}
        </Step>
      )}

      {d.step === 2 && (
        <Step title="Qual sua experiência com musculação?">
          {EXP.map((o) => (
            <button key={o.v} className={`option ${d.experience === o.v ? 'selected' : ''}`}
              onClick={() => next({ experience: o.v })}>
              <span>{o.t}<div className="desc">{o.s}</div></span>
            </button>
          ))}
        </Step>
      )}

      {d.step === 3 && (
        <Step title="Como está sua rotina de treino hoje?" sub="Quem está voltando de pausa recebe um plano de readaptação — sem dor desnecessária na primeira semana.">
          {STATE.map((o) => (
            <button key={o.v} className={`option ${d.currentState === o.v ? 'selected' : ''}`}
              onClick={() => next({ currentState: o.v })}>
              <span>{o.t}<div className="desc">{o.s}</div></span>
            </button>
          ))}
        </Step>
      )}

      {d.step === 4 && (
        <Step title="Onde você vai treinar?">
          {LOCATIONS.map((o) => (
            <button key={o.v} className={`option ${d.location === o.v ? 'selected' : ''}`}
              onClick={() => {
                const skip = o.v === 'gym_full' || o.v === 'home_none'
                next({ location: o.v, equipment: skip ? [] : d.equipment }, skip ? 2 : 1)
              }}>
              <span className="icon">{o.ic}</span>
              <span>{o.t}<div className="desc">{o.s}</div></span>
            </button>
          ))}
        </Step>
      )}

      {d.step === 5 && (
        <Step title="O que você tem disponível?" sub="Só prescrevemos o que você pode executar de verdade.">
          {EQUIP_OPTS.map((o) => (
            <button key={o.v} className={`option ${d.equipment?.includes(o.v) ? 'selected' : ''}`}
              onClick={() => setD({ ...d, equipment: toggleArr(d.equipment, o.v) })}>
              <span>{o.t}</span>
              <span style={{ marginLeft: 'auto' }}>{d.equipment?.includes(o.v) ? '✓' : ''}</span>
            </button>
          ))}
          <button className="btn btn-primary" style={{ marginTop: 20 }}
            disabled={!d.equipment || d.equipment.length === 0}
            onClick={() => next({})}>
            Continuar
          </button>
          <p className="tiny faint center" style={{ marginTop: 10 }}>Peso corporal sempre conta — não precisa marcar.</p>
        </Step>
      )}

      {d.step === 6 && (
        <Step title="Quantos dias por semana você consegue treinar?" sub="Seja realista — dá para ajustar depois.">
          {FREQS.map((f) => (
            <button key={f} className={`option ${d.frequency === f ? 'selected' : ''}`}
              onClick={() => next({ frequency: f })}>
              <span className="num" style={{ fontSize: 20, fontWeight: 800, width: 30 }}>{f}</span>
              <span>dias por semana</span>
            </button>
          ))}
        </Step>
      )}

      {d.step === 7 && (
        <Step title="Quanto tempo por treino?">
          {TIMES.map((o) => (
            <button key={o.v} className={`option ${d.sessionTimeMin === o.v ? 'selected' : ''}`}
              onClick={() => next({ sessionTimeMin: o.v })}>
              <span>{o.t}</span>
            </button>
          ))}
        </Step>
      )}

      {d.step === 8 && (
        <Step title="Alguma região com dor ou limitação?" sub="Vamos evitar os padrões que mais estressam essas regiões.">
          <button className={`option ${(d.limitations ?? []).length === 0 && d.limitations !== undefined ? 'selected' : ''}`}
            onClick={() => next({ limitations: [] })}>
            <span>Nenhuma</span>
          </button>
          {LIMS.map((o) => (
            <button key={o.v} className={`option ${d.limitations?.includes(o.v) ? 'selected' : ''}`}
              onClick={() => setD({ ...d, limitations: toggleArr(d.limitations, o.v) })}>
              <span>{o.t}</span>
              <span style={{ marginLeft: 'auto' }}>{d.limitations?.includes(o.v) ? '✓' : ''}</span>
            </button>
          ))}
          {(d.limitations?.length ?? 0) > 0 && (
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => next({})}>
              Continuar
            </button>
          )}
          <p className="tiny faint" style={{ marginTop: 16 }}>
            O WinFit não substitui avaliação médica. Se você sente dor persistente, procure um profissional de saúde.
          </p>
        </Step>
      )}

      {d.step === 9 && (
        <Step title="Sobre você" sub="Usamos para calibrar o volume e acompanhar seu progresso. Opcional, exceto a idade.">
          <label className="field">Idade</label>
          <input className="input num" type="number" inputMode="numeric" placeholder="Ex.: 28"
            value={age} onChange={(e) => setAge(e.target.value)} />
          <label className="field">Peso (kg) — opcional</label>
          <input className="input num" type="number" inputMode="decimal" placeholder="Ex.: 72"
            value={weight} onChange={(e) => setWeight(e.target.value)} />
          <button className="btn btn-primary" style={{ marginTop: 24 }}
            disabled={!age || Number(age) < 13 || Number(age) > 100}
            onClick={finish}>
            Gerar meu plano
          </button>
        </Step>
      )}
    </div>
  )
}

function Step({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 style={{ fontSize: 24 }}>{title}</h1>
      {sub && <p className="muted small" style={{ marginTop: 6 }}>{sub}</p>}
      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  )
}
