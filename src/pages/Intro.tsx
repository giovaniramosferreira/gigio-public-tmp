import { useNavigate } from 'react-router-dom'

export default function Intro() {
  const nav = useNavigate()
  return (
    <div className="page-full fade-in" style={{ justifyContent: 'space-between' }}>
      <div style={{ paddingTop: 48 }}>
        <div className="eyebrow">WinFit</div>
        <h1 style={{ fontSize: 34, marginTop: 12, lineHeight: 1.15 }}>
          Seu treino, montado para <span className="accent-text">você</span>.
        </h1>
        <p className="muted" style={{ marginTop: 14, fontSize: 17 }}>
          Responda 9 perguntas e receba um plano de musculação sob medida — academia ou casa.
          Registre cada série, veja sua carga subir e progrida com método.
        </p>

        <div className="stack" style={{ marginTop: 28 }}>
          {[
            ['🎯', 'Plano individualizado', 'Objetivo, nível, equipamento e tempo — tudo vira decisão de treino.'],
            ['⚡', 'Registro em 1 toque', 'Séries, cargas e descanso cronometrado, sem burocracia.'],
            ['📈', 'Progressão automática', 'Fechou a meta de repetições? O app manda subir a carga.'],
          ].map(([ic, t, s]) => (
            <div key={t} className="card row">
              <span style={{ fontSize: 26 }}>{ic}</span>
              <div>
                <h3>{t}</h3>
                <div className="small muted">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <button className="btn btn-primary" onClick={() => nav('/onboarding')}>
          Montar meu treino
        </button>
        <p className="tiny faint center" style={{ marginTop: 12 }}>
          Leva ~2 minutos. Seus dados ficam no seu aparelho.
        </p>
      </div>
    </div>
  )
}
