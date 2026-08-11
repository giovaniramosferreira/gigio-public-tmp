import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId, EQUIP_LABEL } from '../data/exercises'
import type { Equipment, Goal, TrainingProfile } from '../types'
import InstallCard from '../components/InstallCard'
import { useOnline, useServiceWorker } from '../lib/pwa'

const GOAL_LABEL: Record<Goal, string> = {
  hypertrophy: 'Ganhar músculo',
  fat_loss: 'Perder gordura',
  strength: 'Ficar mais forte',
  return_fitness: 'Voltar à forma',
  health: 'Saúde e disposição',
}

export default function Profile() {
  const nav = useNavigate()
  const profile = useStore((s) => s.profile)!
  const plan = useStore((s) => s.plan)!
  const regenerate = useStore((s) => s.regenerate)
  const exportData = useStore((s) => s.exportData)
  const resetAll = useStore((s) => s.resetAll)
  const setDraft = useStore((s) => s.setDraft)
  const online = useOnline()
  const { needRefresh, update } = useServiceWorker()
  const [adjust, setAdjust] = useState(false)
  const [freq, setFreq] = useState(profile.frequency)
  const [time, setTime] = useState(profile.sessionTimeMin)
  const [goal, setGoal] = useState(profile.goal)
  const [showPlan, setShowPlan] = useState(false)

  const doExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `winfit-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const applyAdjust = () => {
    const next: TrainingProfile = { ...profile, frequency: freq, sessionTimeMin: time, goal }
    regenerate(next)
    setAdjust(false)
  }

  const redoOnboarding = () => {
    setDraft({ step: 1 })
    nav('/onboarding')
  }

  return (
    <div className="page fade-in">
      <h1>Perfil</h1>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="between">
          <h3>Meu plano</h3>
          <span className="pill accent">{plan.splitLabel}</span>
        </div>
        <p className="small muted num" style={{ marginTop: 6 }}>
          {GOAL_LABEL[profile.goal]} · {profile.frequency}x/semana · ~{profile.sessionTimeMin} min
        </p>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setShowPlan(!showPlan)}>
          {showPlan ? 'Ocultar treinos' : 'Ver treinos da semana'}
        </button>
        {showPlan && (
          <div style={{ marginTop: 10 }}>
            {plan.days.map((d) => (
              <div key={d.id} style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: 14 }}>{d.label} <span className="tiny faint num">~{d.estMin} min</span></h3>
                {d.exercises.map((pe) => (
                  <div key={pe.id} className="between" style={{ marginTop: 4 }}>
                    <span className="small muted">{byId.get(pe.exerciseId)?.name}</span>
                    <span className="tiny faint num">{pe.sets}×{pe.repMin}–{pe.repMax}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-primary btn-sm grow" onClick={() => setAdjust(true)}>Ajustar plano</button>
          <button className="btn btn-ghost btn-sm grow" onClick={redoOnboarding}>Refazer perguntas</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Equipamento</h3>
        <p className="small muted" style={{ marginTop: 6 }}>
          {profile.location === 'gym_full'
            ? 'Academia completa — tudo disponível.'
            : profile.equipment.length > 0
              ? profile.equipment.map((e: Equipment) => EQUIP_LABEL[e]).join(', ') + ' + peso corporal'
              : 'Somente peso corporal.'}
        </p>
        <p className="tiny faint" style={{ marginTop: 6 }}>Para mudar, use "Refazer perguntas".</p>
      </div>

      <div style={{ marginTop: 12 }}>
        <InstallCard variant="settings" />
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Versão</h3>
        <p className="small muted" style={{ marginTop: 6 }}>
          {needRefresh
            ? 'Uma versão nova está pronta para ser aplicada.'
            : online
              ? 'Você está na versão mais recente.'
              : 'Sem conexão — o app roda offline; a checagem de versão volta quando a internet voltar.'}
        </p>
        {needRefresh && (
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={update}>
            Atualizar agora
          </button>
        )}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Seus dados</h3>
        <p className="small muted" style={{ marginTop: 6 }}>
          Tudo fica salvo neste aparelho (navegador). Exporte um backup antes de trocar de aparelho ou limpar dados.
        </p>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={doExport}>
          ⬇ Exportar meus dados (JSON)
        </button>
        <button className="btn btn-danger btn-sm" style={{ marginTop: 10 }}
          onClick={() => {
            if (confirm('Apagar TODOS os dados (plano, histórico, recordes)? Essa ação não tem volta.')) {
              resetAll()
              nav('/')
            }
          }}>
          Apagar todos os dados
        </button>
      </div>

      <p className="tiny faint" style={{ marginTop: 20, textAlign: 'center' }}>
        WinFit MVP · O WinFit não substitui avaliação médica ou profissional de educação física presencial.
        Sentiu dor persistente? Procure um profissional de saúde.
      </p>

      {adjust && (
        <div className="modal-back" onClick={() => setAdjust(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Ajustar plano</h2>
            <p className="tiny faint" style={{ marginTop: 4 }}>
              O plano atual é arquivado e um novo é gerado. Seu histórico e recordes são preservados.
            </p>
            <label className="field">Objetivo</label>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {(Object.keys(GOAL_LABEL) as Goal[]).map((g) => (
                <button key={g} className={`pill ${goal === g ? 'accent' : ''}`} onClick={() => setGoal(g)}>
                  {GOAL_LABEL[g]}
                </button>
              ))}
            </div>
            <label className="field">Dias por semana</label>
            <div className="row">
              {[2, 3, 4, 5, 6].map((f) => (
                <button key={f} className={`pill num ${freq === f ? 'accent' : ''}`} onClick={() => setFreq(f)}>{f}</button>
              ))}
            </div>
            <label className="field">Tempo por treino</label>
            <div className="row">
              {[30, 45, 60, 75].map((t) => (
                <button key={t} className={`pill num ${time === t ? 'accent' : ''}`} onClick={() => setTime(t)}>{t} min</button>
              ))}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={applyAdjust}>
              Gerar novo plano
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
