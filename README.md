# ViralPost

Pipeline automatizado que transforma vídeos em alta do YouTube em carrosséis publicados no Instagram.

## O problema

Produzir conteúdo consistente para Instagram exige achar o que está performando,
entender por que performou e reembalar aquilo no formato certo — todo dia. É repetitivo
o bastante para automatizar, mas exige julgamento editorial demais para um script de
template.

## Como funciona

```
YouTube trending (por nicho)
  → transcrição do vídeo
  → Claude extrai a tese e reescreve em slides
  → Unsplash busca imagem por slide
  → carrossel renderizado (html2canvas)
  → publicação via Instagram Graph API
```

`POST /api/cron/run` roda o ciclo sozinho, autenticado por `CRON_SECRET`, processando
até 3 vídeos por execução e registrando cada rodada em `cron_runs` para auditoria.

## Decisões de projeto

**Hashtags em três faixas de volume.** O Claude devolve grupos `small` (<100K posts),
`medium` (100K–1M) e `large` (>1M). Apostar só em hashtag grande é competir com todo
mundo; só em pequena, não alcança ninguém. A mistura é o que dá chance de rankear.

**`altText` como campo obrigatório do slide.** O Instagram indexa alt text, então ele
sai no mesmo output do Claude — em vez de virar um passo separado que ninguém executa.

**Transcrição truncada em 8.000 caracteres.** Vídeo longo estoura contexto e custo sem
melhorar o carrossel: a tese central aparece cedo. O corte é em `lib/transcript.ts`.

**Teto de 3 vídeos por rodada.** Transcrição e geração são as etapas caras — o limite
mantém a execução dentro do timeout de serverless e o custo de API previsível.

**Estado no Postgres.** `niches`, `trending_videos`, `carousel_posts` e `cron_runs` no
Supabase: o cron precisa saber o que já processou entre execuções.

## Stack

Next.js 16 (App Router) · TypeScript · Supabase (Postgres + Auth) · Anthropic SDK ·
YouTube Data API · Instagram Graph API v19 · Unsplash · Resend (OTP por e-mail)

## Rodando local

```bash
npm install
cp .env.example .env.local   # preencha as chaves
npm run dev
```

Aplique `supabase/schema.sql` no seu projeto Supabase e depois as migrações
(`migration_*.sql`).

### Variáveis de ambiente

| variável | uso |
|---|---|
| `ANTHROPIC_API_KEY` | geração dos slides |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | escrita server-side e cron |
| `YOUTUBE_API_KEY` | busca de vídeos em alta |
| `SUPADATA_API_KEY` | fallback de transcrição |
| `UNSPLASH_ACCESS_KEY` | imagens dos slides |
| `RESEND_API_KEY` | envio do OTP de login |
| `CRON_SECRET` | autentica `POST /api/cron/run` |
