# POUP — Guia do Projeto para Claude Code

## Stack real

- **Framework**: Next.js 14 App Router (TypeScript strict)
- **Banco de dados**: Supabase (PostgreSQL + Auth)
- **Estilização**: Inline styles + Tailwind CSS utilitário (classes básicas como `flex`, `gap-*`, `rounded-*`)
- **Animações**: Framer Motion
- **Charts**: Recharts (importação direta, sem shadcn)
- **Drag & Drop**: @dnd-kit/core
- **Notificações**: Sonner (toast)
- **Ícones**: Lucide React
- **IA**: Anthropic SDK (`@anthropic-ai/sdk`) — modelo `claude-haiku-4-5-20251001`
- **Email**: Resend
- **Deploy**: Vercel

> ⚠️ **Não usamos**: shadcn/ui, react-hook-form, Zod, `space-x-*`/`space-y-*`, `bg-primary`, cores semânticas do Tailwind.

---

## Identidade visual

- Cor primária: `#8A05BE` (roxo)
- Gradiente: `#8A05BE → #a83eff`
- Fundo: `#0d001a` (app) / `#150025` (cards) / `#1e0035` (inputs)
- Texto principal: `#f0e6ff`
- Texto muted: `#9b7db8` / `#6b4d80`
- Accent: `#d49dff`
- Tema: dark mode exclusivo
- Fontes: **Sora** (títulos/display) + **DM Sans** (corpo/labels)

---

## Estrutura de pastas

```
app/
  (app)/               ← páginas autenticadas (tem layout com Sidebar)
    layout.tsx         ← auth check + Sidebar
    dashboard/
      page.tsx         ← server component, force-dynamic
    transactions/
      page.tsx         ← server component, force-dynamic
      TransactionFilters.tsx
    upload/
      page.tsx         ← wrapper server
      UploadClient.tsx ← lógica de upload (client component)
  (auth)/              ← login, signup (sem Sidebar)
    login/page.tsx
    signup/page.tsx
  auth/callback/
    route.ts           ← OAuth callback
  api/
    categorize/
      route.ts         ← categorização IA (Pro only)
  layout.tsx           ← root layout, Toaster
  page.tsx             ← landing page
  icon.tsx             ← favicon gerado pelo Next.js (ImageResponse)

components/
  dashboard/
    StatsCards.tsx
    StoryCard.tsx
    SpendingLineChart.tsx
    CategoryChart.tsx
    TransactionList.tsx  ← recebe selectedMonth e totalCount
    MonthFilter.tsx
    ReclassifyModal.tsx  ← modal de reclassificação drag-drop
    EmptyState.tsx
  layout/
    Sidebar.tsx

lib/
  categories.ts        ← ⭐ FONTE ÚNICA de todas as categorias
  analytics.ts         ← MONTH_NAMES, CATEGORY_COLORS, calcMonthlyStats, formatBRL, formatDate, getMonthLabel
  storytelling.ts      ← generateStory (narrativa financeira)
  parsers/
    nubank.ts          ← parseNubankCSV, categorizeByRules
  supabase/
    client.ts          ← createClientComponentClient (client components)
    server.ts          ← createServerClient (server components)

types/
  index.ts             ← Profile, Statement, Transaction, CategorySummary, MonthlyStats, ParsedTransaction

middleware.ts          ← proteção de rotas (usa getSession — correto no middleware)
```

---

## Schema do banco (Supabase)

```sql
profiles
  id uuid (FK → auth.users)
  name text
  phone text
  plan text ('free' | 'pro')
  custom_categories text[]  DEFAULT '{}'
  created_at timestamptz

statements
  id uuid
  user_id uuid (FK → auth.users)
  filename text
  period_start date
  period_end date
  total_income numeric
  total_expenses numeric
  uploaded_at timestamptz

transactions
  id uuid
  user_id uuid (FK → auth.users)
  statement_id uuid (FK → statements ON DELETE CASCADE)
  date date
  description text
  amount numeric          ← em reais (float), NÃO centavos
  type text ('credit' | 'debit')
  category text
  category_ai boolean
  raw_data jsonb
  created_at timestamptz
```

> ⚠️ **Valores em reais (float)**, não centavos. `amount = 14.75` = R$ 14,75.

---

## Categorias — fonte única de verdade

**Sempre importar de `@/lib/categories`**. Nunca declarar listas de categorias inline.

```ts
import { CATEGORY_NAMES, VALID_CATEGORIES, DROP_CATEGORIES } from '@/lib/categories'
```

- `CATEGORY_NAMES` — lista completa (inclui Receita e Investimentos)
- `VALID_CATEGORIES` — Set para validação O(1)
- `DROP_CATEGORIES` — lista para UI de drag-drop (exclui Receita e Investimentos)

Ao adicionar uma nova categoria:
1. Adicionar em `lib/categories.ts`
2. Adicionar cor em `CATEGORY_COLORS` em `lib/analytics.ts`
3. Adicionar regra de keywords em `lib/parsers/nubank.ts` (CATEGORY_RULES)
4. Adicionar regra no prompt de IA em `app/api/categorize/route.ts`

---

## Supabase — regras de uso

```ts
// ✅ Server components e route handlers
import { createServerClient } from '@/lib/supabase/server'
const { data: { user } } = await supabase.auth.getUser()  // ← SEMPRE getUser() no servidor

// ✅ Client components
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ✅ Route handlers (API routes)
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
```

> ⚠️ **`getSession()` só é seguro no middleware** (onde o cookie é refreshado). Em server components e API routes, usar `getUser()` — ele valida o JWT contra o servidor.

---

## Convenções de código

### Server vs Client

- **Server components por padrão** — adicionar `'use client'` só quando necessário (hooks, eventos, estado)
- Páginas que leem dados do Supabase e não devem ser cacheadas: `export const dynamic = 'force-dynamic'` no topo
- Props tipadas com `interface`, não `type alias`

### Estilo

- **Inline styles** para tudo que depende das cores do projeto
- Tailwind apenas para layout (`flex`, `grid`, `gap-*`, `p-*`, `rounded-*`, `overflow-*`, `max-w-*`, etc.)
- **Nunca** usar cores Tailwind hardcoded (`bg-purple-600`, `text-gray-500`) — usar as variáveis de cor do projeto

### Dados

- Valores monetários: **reais (float)** no banco e no código — `amount: 14.75`
- Formatar com `formatBRL(value)` de `@/lib/analytics`
- Datas no formato `YYYY-MM-DD` no banco, exibir com `formatDate(dateStr)` de `@/lib/analytics`

### TypeScript

- Strict mode ativo — sem `any`
- **Iteração de `Set` e `Map`**: usar `Array.from()` — o projeto tem `downlevelIteration` desativado
  ```ts
  // ✅ correto
  Array.from(mySet.values()).forEach(...)
  new Set(Array.from(prev).concat(id))

  // ❌ causa erro TS2802
  for (const x of mySet) { ... }
  new Set([...prev, id])
  ```

---

## Autenticação

- **Magic Link OTP** — sem senhas
- Fluxo: email → código OTP 6-8 dígitos → `supabase.auth.verifyOtp()`
- Middleware protege: `/dashboard`, `/transactions`, `/upload`
- Redireciona autenticados de `/login` e `/signup` para `/dashboard`

---

## Funcionalidades principais

### Upload de extrato
- Formatos suportados: CSV do Nubank (cartão de crédito e conta)
- Detecção automática de formato pelo header do CSV
- Categorização por regras de keywords no upload (sem IA)
- Limite: 200 arquivos por lote, 10MB por arquivo
- Duplicatas detectadas por nome do arquivo
- Transações com `statement_id` — CASCADE delete quando statement é apagado

### Dashboard
- Dois modos: **Fatura** (agrupa por `statement.period_end`) e **Mês** (por data calendário)
- Toggle Fatura/Mês preserva o mês selecionado via URL params
- Mostra até 50 transações recentes com link "ver todas →"

### Reclassificação (ReclassifyModal)
- Drag-drop de transações entre categorias
- Animação de "voo" do card até a zona de destino (posição DOM real, ambos os eixos)
- Categorias customizadas salvas em `profiles.custom_categories` (Supabase, não localStorage)
- Ao trocar de categoria no painel direito, `removed` e `reclassified` **não são resetados** (itens movidos permanecem movidos)
- Em erro no `supabase.update()`, reverter **ambos** `removed` e `reclassified`

### Categorização IA (Pro)
- Endpoint: `POST /api/categorize`
- Fluxo híbrido:
  1. Busca histórico do usuário (até 1.000 transações classificadas)
  2. Match direto por descrição normalizada (sem API call)
  3. Chama Claude apenas para as não resolvidas (batches de 25)
- Timeout: 30s no cliente Anthropic
- Só aceita categorias da `VALID_CATEGORIES`

---

## Armadilhas conhecidas — NÃO repita

| ❌ Erro | ✅ Correto |
|---------|-----------|
| `getSession()` em server component | `getUser()` em server component |
| Declarar lista de categorias inline | Importar de `@/lib/categories` |
| `MONTH_NAMES` inline | Importar de `@/lib/analytics` |
| `new Set([...prev, id])` | `new Set(Array.from(prev).concat(id))` |
| `for (const x of map.values())` | `Array.from(map.values()).forEach(...)` |
| `select('id, period_start, period_end')` sem usar `period_start` | Selecionar só o que usar |
| Categorias customizadas em `localStorage` | Salvar em `profiles.custom_categories` |
| `router.refresh()` antes de checar erro do Supabase | Só chamar em branch de sucesso |
| Adicionar categoria só no prompt de IA | Atualizar os 4 lugares (categories.ts, analytics.ts, nubank.ts, route.ts) |
| `export const dynamic` faltando em páginas com dados | Sempre em páginas autenticadas que não devem ser cacheadas |
| Esquecer de reverter `reclassified` ao desfazer drag | Reverter `removed` E `reclassified` juntos |
| Fazer fetch de `profile` e `statements` sequencialmente | `Promise.all([...])` para fetches independentes |
| Iterar `history` duas vezes para `knownMap` e `freqMap` | Um único loop, duas estruturas |

---

## Comandos

```bash
npm run dev          # desenvolvimento (porta 3000, ou próxima disponível)
npm run build        # build de produção
npx tsc --noEmit     # checar TypeScript sem compilar
```
