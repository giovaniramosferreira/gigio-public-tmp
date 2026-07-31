# WinFit — MVP Web (PWA)

Treinador inteligente de bolso: monta, guia e evolui seu treino de musculação — academia ou casa.
Documento-mestre do produto: [PRODUCT_SPEC.md](./PRODUCT_SPEC.md).

## O que este MVP entrega

- **Onboarding de 9 passos** → perfil de treino (objetivo, nível, estado atual, local, equipamento, frequência, tempo, limitações).
- **Gerador de plano semi-determinístico** (templates parametrizados, seção 19 da spec): divisão por frequência×nível, volume por grupo, seleção por slots com filtro duro de equipamento/limitação, prescrição por objetivo, ajuste ao tempo disponível, rampa de recomeço para quem volta de pausa.
- **Preview com racional explicável** ("Por que este plano?").
- **Player de treino**: log de série em 1 toque, steppers de carga/reps, timer de descanso automático (âncora absoluta — sobrevive a reload), substituição por equivalência, pular, retomar sessão em até 8 h.
- **Dupla progressão automática**: fechou o teto de reps → app sugere +carga na próxima sessão.
- **Recordes pessoais** com detecção no log (sem PRs triviais na 1ª sessão).
- **Progresso**: semana, volume, PRs, evolução por exercício com gráfico, histórico.
- **Biblioteca** com ~70 exercícios PT-BR (instruções, erros comuns, equivalências).
- **PWA offline-first, 100% local**: dados em `localStorage`, sem backend, custo de infra zero. Export de dados em JSON.

## App instalável (PWA)

O WinFit é um app de verdade na tela de início — sem loja, sem download, sem backend.

- **Instalação**: no Android/desktop o app captura o `beforeinstallprompt` e oferece
  "Instalar app" na Home (dispensável por 14 dias) e no Perfil; no iOS/Safari, que não
  tem instalador nativo, o mesmo card ensina o caminho (Compartilhar → Adicionar à Tela de Início).
- **Tela cheia**: `display: standalone`, ícones maskable, `apple-touch-icon`, splash screens
  para as resoluções de iPhone/iPad e respeito às áreas seguras (notch e barra inferior).
- **Atalhos** do ícone: "Treinar agora" e "Meu progresso".
- **Offline**: o shell é pré-cacheado pelo service worker; como os dados já vivem no
  `localStorage`, o app inteiro funciona sem rede — treinar no subsolo da academia é o caso normal,
  não o excepcional. O aviso de "sem conexão" aparece por alguns segundos e sai da frente.
- **Atualização sob confirmação** (`registerType: 'prompt'`): quando sai uma versão nova o app
  avisa e só troca quando você toca em "Atualizar" — nunca no meio de uma série. A checagem
  acontece a cada hora e sempre que o app volta ao primeiro plano.

Detalhes de implementação: `src/lib/pwa.ts` (registro único do service worker, estado de
instalação e de conexão), `src/components/PwaToasts.tsx`, `src/components/InstallCard.tsx`
e o bloco `VitePWA` em `vite.config.ts`.

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # produção → dist/
npm run preview  # serve o dist/ — necessário para testar service worker e instalação

SW_DEV=true npm run dev             # habilita o service worker em desenvolvimento
npm run icons                       # regera ícones e splash screens a partir dos SVGs
npx tsx scripts/test-generator.ts   # suíte combinatória do gerador (56k combinações)
```

> `npm run icons` renderiza os PNGs com Chrome/Chromium headless (defina `CHROME_BIN` se ele
> não estiver num caminho padrão) e imprime as tags `apple-touch-startup-image` do `index.html`.
> Só precisa rodar quando a marca mudar — os PNGs ficam versionados em `public/`.

## Deploy grátis (MVP)

Qualquer hosting estático serve o `dist/`:

- **Cloudflare Pages / Vercel / Netlify** (free tier): conectar o repo, build `npm run build`, output `dist`.
- Rotas usam hash (`#/`) — nenhuma configuração de rewrite necessária.
- Exigências do PWA no hosting: servir por **HTTPS** (senão o service worker não registra) e
  **não cachear** `sw.js` nem `manifest.webmanifest` — o `render.yaml` já faz isso.

## Roadmap de migração (spec seções 30–32)

1. **Agora (web local-first)**: validar ativação e retenção sem custo.
2. **Fase 2**: backend Supabase (auth + sync da fila de sessões), RevenueCat Web/paywall, analytics PostHog.
3. **Fase 3**: empacotar iOS/Android (Capacitor sobre esta mesma base React, ou migração React Native reaproveitando `src/lib` e `src/data`, que são TypeScript puro sem DOM).

> O domínio (gerador, progressão, tipos, catálogo) está isolado em `src/lib` + `src/data` sem dependência de UI — projetado para portar.
