// Gera os PNGs do PWA (ícones, apple-touch-icon e splash screens iOS) a partir
// dos SVGs em public/. Rodar só quando a marca mudar: `npm run icons`.
//
// Renderiza com Chrome/Chromium headless via DevTools Protocol — sem dependência
// npm nativa (sharp/canvas) e com tamanho de saída exato em qualquer plataforma.
// Aponte CHROME_BIN para o binário se ele não estiver em um dos caminhos conhecidos.

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = resolve(root, 'public')
const splashDir = resolve(publicDir, 'splash')
const tmpDir = resolve(root, 'node_modules/.cache/winfit-icons')

const BG = '#0d1117'

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].filter(Boolean)

const chromeBin = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!chromeBin) {
  console.error('Chrome/Chromium não encontrado. Defina CHROME_BIN=/caminho/para/chrome')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function freePort() {
  return new Promise((res, rej) => {
    const srv = createServer()
    srv.on('error', rej)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => res(port))
    })
  })
}

/** Sobe o Chrome headless e devolve um cliente CDP mínimo sobre a aba inicial. */
async function launch() {
  const port = await freePort()
  const proc = spawn(
    chromeBin,
    [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check',
      `--remote-debugging-port=${port}`, '--user-data-dir=' + resolve(tmpDir, 'profile'),
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  let target = null
  for (let i = 0; i < 100 && !target; i++) {
    await sleep(100)
    try {
      const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json())
      target = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
    } catch { /* ainda subindo */ }
  }
  if (!target) {
    proc.kill()
    throw new Error('Chrome não respondeu na porta de debug')
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((res, rej) => {
    ws.onopen = res
    ws.onerror = () => rej(new Error('falha ao conectar no DevTools'))
  })

  let nextId = 0
  const pending = new Map()
  const events = new Map()
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id !== undefined) {
      const p = pending.get(msg.id)
      pending.delete(msg.id)
      if (p) (msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result))
    } else {
      events.get(msg.method)?.forEach((fn) => fn(msg.params))
    }
  }

  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const id = ++nextId
      pending.set(id, { res, rej })
      ws.send(JSON.stringify({ id, method, params }))
    })

  const once = (method) =>
    new Promise((res) => {
      const fns = events.get(method) ?? []
      const fn = (p) => {
        events.set(method, (events.get(method) ?? []).filter((f) => f !== fn))
        res(p)
      }
      events.set(method, [...fns, fn])
    })

  await send('Page.enable')
  return { send, once, close: () => { ws.close(); proc.kill() } }
}

const sized = (svg, w, h) => svg.replace('<svg ', `<svg width="${w}" height="${h}" `)

const iconSvg = readFileSync(resolve(publicDir, 'icon.svg'), 'utf8')
const maskableSvg = readFileSync(resolve(publicDir, 'icon-maskable.svg'), 'utf8')

const page = await launch()

/** Renderiza um HTML em PNG com dimensões exatas. */
async function shot(html, width, height, out, { transparent = false } = {}) {
  mkdirSync(dirname(out), { recursive: true })
  const file = resolve(tmpDir, 'page.html')
  writeFileSync(
    file,
    `<!doctype html><meta charset="utf-8"><style>
      html,body{margin:0;padding:0;width:${width}px;height:${height}px;overflow:hidden}
      body{background:${transparent ? 'transparent' : BG};display:flex;align-items:center;justify-content:center}
      svg{display:block}
    </style>${html}`,
  )

  await page.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: false,
  })
  await page.send('Emulation.setDefaultBackgroundColorOverride', {
    color: transparent ? { r: 0, g: 0, b: 0, a: 0 } : { r: 13, g: 17, b: 23, a: 1 },
  })
  const loaded = page.once('Page.loadEventFired')
  await page.send('Page.navigate', { url: `file://${file}?t=${Date.now()}` })
  await loaded

  const { data } = await page.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width, height, scale: 1 },
  })
  writeFileSync(out, Buffer.from(data, 'base64'))
}

mkdirSync(tmpDir, { recursive: true })

// ---------- ícones ----------
const icons = [
  ['icon-32.png', 32, iconSvg, true],
  ['icon-192.png', 192, iconSvg, true],
  ['icon-512.png', 512, iconSvg, true],
  ['icon-maskable-192.png', 192, maskableSvg, false],
  ['icon-maskable-512.png', 512, maskableSvg, false],
  // iOS arredonda o ícone por conta própria e pinta transparência de preto:
  // a mesma arte, sobre fundo opaco (os cantos do SVG somem contra o fundo igual).
  ['apple-touch-icon.png', 180, iconSvg, false],
]

for (const [name, size, svg, transparent] of icons) {
  await shot(sized(svg, size, size), size, size, resolve(publicDir, name), { transparent })
  console.log('✓', name, `${size}×${size}`)
}

// ---------- splash screens iOS ----------
// Sem estas imagens o iOS mostra uma tela branca ao abrir o app instalado.
const SPLASH = [
  [440, 956, 3], [430, 932, 3], [428, 926, 3], [414, 896, 3], [414, 896, 2],
  [414, 736, 3], [402, 874, 3], [393, 852, 3], [390, 844, 3], [375, 812, 3],
  [375, 667, 2], [1024, 1366, 2], [834, 1194, 2], [768, 1024, 2],
]

rmSync(splashDir, { recursive: true, force: true })
const links = []
for (const [cssW, cssH, dpr] of SPLASH) {
  const w = cssW * dpr
  const h = cssH * dpr
  const mark = Math.round(Math.min(w, h) * 0.32)
  const name = `apple-splash-${w}-${h}.png`
  await shot(sized(iconSvg, mark, mark), w, h, resolve(splashDir, name))
  links.push(
    `<link rel="apple-touch-startup-image" href="/splash/${name}" ` +
      `media="(device-width: ${cssW}px) and (device-height: ${cssH}px) and ` +
      `(-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)" />`,
  )
  console.log('✓', name)
}

page.close()
await sleep(300) // deixa o Chrome liberar o perfil temporário antes de removê-lo
rmSync(tmpDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
console.log('\n--- tags para o index.html ---\n' + links.join('\n'))
