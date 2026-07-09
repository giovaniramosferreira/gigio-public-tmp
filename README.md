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

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # produção → dist/
npx tsx scripts/test-generator.ts   # suíte combinatória do gerador (56k combinações)
```

## Deploy grátis (MVP)

Qualquer hosting estático serve o `dist/`:

- **Cloudflare Pages / Vercel / Netlify** (free tier): conectar o repo, build `npm run build`, output `dist`.
- Rotas usam hash (`#/`) — nenhuma configuração de rewrite necessária.

## Roadmap de migração (spec seções 30–32)

1. **Agora (web local-first)**: validar ativação e retenção sem custo.
2. **Fase 2**: backend Supabase (auth + sync da fila de sessões), RevenueCat Web/paywall, analytics PostHog.
3. **Fase 3**: empacotar iOS/Android (Capacitor sobre esta mesma base React, ou migração React Native reaproveitando `src/lib` e `src/data`, que são TypeScript puro sem DOM).

> O domínio (gerador, progressão, tipos, catálogo) está isolado em `src/lib` + `src/data` sem dependência de UI — projetado para portar.
