// Camada PWA: registro do service worker, atualização sob confirmação,
// prompt de instalação (A2HS) e estado de conexão.
//
// O app é local-first (localStorage): offline não é um modo degradado, é o modo
// normal. O service worker existe para que o *shell* também sobreviva sem rede.

import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

const UPDATE_CHECK_MS = 60 * 60 * 1000 // 1 h
const INSTALL_DISMISSED_KEY = 'winfit-install-dismissed'
const DISMISS_WINDOW_MS = 14 * 24 * 60 * 60 * 1000 // 14 dias

const isBrowser = typeof window !== 'undefined'

/** Assinatura simples: o estado do PWA é global, não pertence a nenhuma tela. */
function createChannel() {
  const listeners = new Set<() => void>()
  return {
    subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } },
    emit: () => listeners.forEach((fn) => fn()),
  }
}

/** Re-renderiza o componente a cada evento do canal. */
function useChannel(channel: ReturnType<typeof createChannel>) {
  const [, force] = useState(0)
  useEffect(() => channel.subscribe(() => force((n) => n + 1)), [channel])
}

// ---------------------------------------------------------------- instalação

/** O app está rodando instalado (tela de início / janela própria)? */
export function isStandalone(): boolean {
  if (!isBrowser) return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    // iOS Safari, que não implementa display-mode
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIOS(): boolean {
  if (!isBrowser) return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

/** No iOS só o Safari instala na tela de início — Chrome/Firefox lá não têm a opção. */
export function isIOSSafari(): boolean {
  if (!isIOS()) return false
  const ua = navigator.userAgent
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// O evento chega uma única vez e pode disparar antes do React montar:
// guardamos aqui e avisamos quem se inscrever depois.
const installChannel = createChannel()
let deferredPrompt: BeforeInstallPromptEvent | null = null
let installed = false

if (isBrowser) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // impede o mini-infobar; nós decidimos quando pedir
    deferredPrompt = e as BeforeInstallPromptEvent
    installChannel.emit()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    installed = true
    installChannel.emit()
  })
}

function dismissedRecently(): boolean {
  const raw = localStorage.getItem(INSTALL_DISMISSED_KEY)
  if (!raw) return false
  const ts = Number(raw)
  return Number.isFinite(ts) && Date.now() - ts < DISMISS_WINDOW_MS
}

export interface InstallState {
  /** Dá para chamar o instalador nativo agora (Android/Chrome/Edge). */
  canInstall: boolean
  /** iOS Safari: instalação é manual, via menu Compartilhar. */
  needsIOSInstructions: boolean
  /** Já está instalado (ou acabou de ser). */
  installed: boolean
  /** Banner de instalação deve aparecer (respeita "agora não"). */
  shouldSuggest: boolean
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
  dismiss: () => void
}

export function useInstallPrompt(): InstallState {
  useChannel(installChannel)
  const [dismissed, setDismissed] = useState(() => dismissedRecently())
  const standalone = isStandalone()

  const canInstall = !standalone && !installed && deferredPrompt !== null
  const needsIOSInstructions = !standalone && !installed && isIOSSafari() && !deferredPrompt

  return {
    canInstall,
    needsIOSInstructions,
    installed: installed || standalone,
    shouldSuggest: (canInstall || needsIOSInstructions) && !dismissed,
    install: async () => {
      if (!deferredPrompt) return 'unavailable'
      const evt = deferredPrompt
      await evt.prompt()
      const { outcome } = await evt.userChoice
      deferredPrompt = null // o evento é de uso único
      installChannel.emit()
      return outcome
    },
    dismiss: () => {
      localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now()))
      setDismissed(true)
    },
  }
}

// ----------------------------------------------------------- service worker

// Registro único no módulo: se cada tela registrasse o seu, cada uma teria um
// estado diferente de "tem versão nova".
const swChannel = createChannel()
let needRefresh = false
let offlineReady = false

const updateSW = isBrowser
  ? registerSW({
      immediate: true,
      onNeedRefresh() { needRefresh = true; swChannel.emit() },
      onOfflineReady() { offlineReady = true; swChannel.emit() },
      onRegisteredSW(_url, registration) {
        if (!registration) return
        // Um app instalado pode ficar dias sem recarregar: procura versão nova
        // de hora em hora e sempre que volta ao primeiro plano.
        const check = () => { if (navigator.onLine) void registration.update() }
        setInterval(check, UPDATE_CHECK_MS)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check()
        })
      },
      onRegisterError(err) {
        console.error('[pwa] falha ao registrar o service worker', err)
      },
    })
  : async () => {}

export interface ServiceWorkerState {
  /** Há uma versão nova esperando para entrar. */
  needRefresh: boolean
  /** O app terminou de ser cacheado — funciona sem rede a partir de agora. */
  offlineReady: boolean
  /** Aplica a atualização e recarrega. */
  update: () => void
  /** Fecha os avisos sem aplicar nada. */
  dismiss: () => void
}

let reloading = false
function reloadOnce() {
  if (reloading) return
  reloading = true
  window.location.reload()
}

/**
 * Aplica a versão nova: manda o service worker em espera assumir e recarrega
 * quando ele assumir de fato. O recarregamento é nosso e não do workbox-window,
 * que só recarrega sozinho quando o SW anterior já controlava a página — não é
 * o caso de quem instalou o app nesta mesma sessão.
 */
function applyUpdate() {
  if (isBrowser && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', reloadOnce, { once: true })
    // Rede ruim ou mensagem perdida: recarrega assim mesmo, a versão nova entra
    // no próximo boot em vez de deixar o botão "Atualizar" sem efeito.
    setTimeout(reloadOnce, 3000)
  }
  void updateSW(true)
}

export function useServiceWorker(): ServiceWorkerState {
  useChannel(swChannel)
  return {
    needRefresh,
    offlineReady,
    update: applyUpdate,
    dismiss: () => {
      needRefresh = false
      offlineReady = false
      swChannel.emit()
    },
  }
}

// ---------------------------------------------------------------- conexão

/** `true` enquanto o navegador se considera com rede. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => (isBrowser ? navigator.onLine : true))
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])
  return online
}
