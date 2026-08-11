import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useOnline, useServiceWorker } from '../lib/pwa'

/** Mostra `true` por alguns segundos a cada vez que `flag` fica ativa. */
function useTransient(flag: boolean, ms: number): boolean {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!flag) {
      setVisible(false)
      return
    }
    setVisible(true)
    const t = setTimeout(() => setVisible(false), ms)
    return () => clearTimeout(t)
  }, [flag, ms])
  return visible
}

/**
 * Avisos do app, empilhados no topo para não brigar com a tab bar nem com a
 * MiniBar. Ficar offline é o modo normal de um app local-first: o aviso serve
 * para tranquilizar e sair da frente, não para alarmar.
 */
export default function PwaToasts() {
  const online = useOnline()
  const { needRefresh, offlineReady, update, dismiss } = useServiceWorker()
  const showOffline = useTransient(!online, 5000)
  const showOfflineReady = useTransient(offlineReady, 4000)
  const inPlayer = useLocation().pathname === '/player'

  // Durante o treino nada interrompe: a atualização espera o fim da sessão.
  const showUpdate = needRefresh && !inPlayer

  if (!showOffline && !showOfflineReady && !showUpdate) return null

  return (
    <div className="toast-stack">
      {showOffline && (
        <div className="toast">
          <span className="ic">📴</span>
          <div className="grow small">
            <b>Sem conexão.</b> Seu treino continua funcionando normalmente.
          </div>
        </div>
      )}

      {showOfflineReady && (
        <div className="toast">
          <span className="ic">✓</span>
          <div className="grow small">
            <b>App pronto para usar offline.</b>
          </div>
        </div>
      )}

      {showUpdate && (
        <div className="toast toast-action">
          <div className="grow small">
            <b>Nova versão disponível.</b>
            <div className="tiny faint">Seus dados e o histórico ficam intactos.</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={update}>Atualizar</button>
          <button className="toast-x" onClick={dismiss} aria-label="Agora não">×</button>
        </div>
      )}
    </div>
  )
}
