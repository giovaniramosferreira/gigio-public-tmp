import { useState } from 'react'
import { isIOSSafari, useInstallPrompt } from '../lib/pwa'

const IOS_STEPS = [
  ['1', 'Toque em Compartilhar', 'O ícone ⬆️ na barra do Safari.'],
  ['2', 'Escolha "Adicionar à Tela de Início"', 'Role a lista de opções até encontrar.'],
  ['3', 'Toque em "Adicionar"', 'O WinFit vira um app, com ícone e tela cheia.'],
]

/**
 * Convite para instalar o app.
 *
 * - `variant="suggest"`: card dispensável na Home, só quando faz sentido pedir.
 * - `variant="settings"`: estado permanente no Perfil (instalado / como instalar).
 */
export default function InstallCard({ variant = 'suggest' }: { variant?: 'suggest' | 'settings' }) {
  const { canInstall, needsIOSInstructions, installed, shouldSuggest, install, dismiss } =
    useInstallPrompt()
  const [showSteps, setShowSteps] = useState(false)
  const [busy, setBusy] = useState(false)

  if (variant === 'suggest' && !shouldSuggest) return null

  if (variant === 'settings' && installed) {
    return (
      <div className="card">
        <h3>Aplicativo</h3>
        <p className="small muted" style={{ marginTop: 6 }}>
          ✓ WinFit está instalado neste aparelho e funciona sem internet.
        </p>
      </div>
    )
  }

  const doInstall = async () => {
    setBusy(true)
    const outcome = await install()
    setBusy(false)
    if (outcome === 'unavailable') setShowSteps(true)
  }

  // Sem instalador nativo e sem Safari no iOS (ex.: Chrome no iPhone, desktop já instalado):
  // no Perfil vira uma dica; na Home não aparece nada.
  if (!canInstall && !needsIOSInstructions) {
    if (variant === 'suggest') return null
    return (
      <div className="card">
        <h3>Aplicativo</h3>
        <p className="small muted" style={{ marginTop: 6 }}>
          Use o menu do navegador para adicionar o WinFit à tela de início
          {isIOSSafari() ? '' : ' (procure por "Instalar app" ou "Adicionar à tela de início")'}.
          Instalado, ele abre em tela cheia e funciona offline.
        </p>
      </div>
    )
  }

  return (
    <div className="card install-card">
      <div className="row">
        <img src="/icon-192.png" alt="" width={44} height={44} className="install-icon" />
        <div className="grow">
          <h3>Instalar o WinFit</h3>
          <div className="small muted">
            Abre em tela cheia, sem barra do navegador, e funciona sem internet na academia.
          </div>
        </div>
      </div>

      {canInstall ? (
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-primary btn-sm grow" onClick={doInstall} disabled={busy}>
            Instalar app
          </button>
          {variant === 'suggest' && (
            <button className="btn btn-quiet btn-sm" onClick={dismiss}>Agora não</button>
          )}
        </div>
      ) : (
        <>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn btn-ghost btn-sm grow" onClick={() => setShowSteps(!showSteps)}>
              {showSteps ? 'Ocultar passos' : 'Como instalar'}
            </button>
            {variant === 'suggest' && (
              <button className="btn btn-quiet btn-sm" onClick={dismiss}>Agora não</button>
            )}
          </div>
          {showSteps && (
            <div style={{ marginTop: 8 }}>
              {IOS_STEPS.map(([n, title, desc]) => (
                <div key={n} className="row install-step">
                  <span className="step-n num">{n}</span>
                  <div>
                    <div className="small"><b>{title}</b></div>
                    <div className="tiny faint">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
