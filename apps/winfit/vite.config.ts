import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const icons = [
  { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' as const },
  { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' as const },
  { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' as const },
  { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' as const },
  { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' as const },
]

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': a nova versão só entra quando o usuário toca em "Atualizar" —
      // recarregar sozinho no meio de uma série seria hostil (princípio 1 da spec).
      registerType: 'prompt',
      // O registro acontece uma única vez em src/lib/pwa.ts.
      injectRegister: null,
      // Os ícones já entram no precache pelo globPatterns abaixo — sem
      // `includeAssets`/`includeManifestIcons` para não duplicar entradas.
      includeManifestIcons: false,
      manifest: {
        id: '/',
        name: 'WinFit — Treino com método',
        short_name: 'WinFit',
        description: 'Seu treino montado, guiado e evoluído. Academia ou casa.',
        lang: 'pt-BR',
        dir: 'ltr',
        scope: '/',
        start_url: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        background_color: '#0d1117',
        theme_color: '#0d1117',
        categories: ['health', 'fitness', 'sports', 'lifestyle'],
        prefer_related_applications: false,
        icons,
        shortcuts: [
          {
            name: 'Treinar agora',
            short_name: 'Treinar',
            description: 'Abrir o treino de hoje',
            url: '/#/home',
            icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Meu progresso',
            short_name: 'Progresso',
            description: 'Volume, recordes e evolução por exercício',
            url: '/#/progress',
            icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        // (o manifest.webmanifest é adicionado ao precache pelo próprio plugin)
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // As splash screens do iOS só são lidas na instalação: ficam fora do
        // precache para não baixar ~300 kB no primeiro acesso.
        globIgnores: ['**/splash/**'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false, // troca de versão só sob confirmação do usuário
      },
      devOptions: {
        // Ligue com `SW_DEV=true npm run dev` para testar o service worker localmente.
        enabled: process.env.SW_DEV === 'true',
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
})
