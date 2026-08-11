# POUP 💜

Dashboard financeiro inteligente com importação de extratos Nubank.

## Stack
- **Next.js 14** (App Router) + TypeScript
- **Supabase** (Auth + Banco de dados)
- **Tailwind CSS** + Framer Motion
- **Recharts** (gráficos)
- **Resend** (e-mails magic link)

---

## Setup em 5 passos

### 1. Clonar e instalar
```bash
git clone <repo>
cd poup
npm install
```

### 2. Variáveis de ambiente
```bash
cp .env.local.example .env.local
```
Preencha as variáveis no `.env.local`.

### 3. Banco de dados (Supabase)
No painel do Supabase → **SQL Editor** → execute o arquivo:
```
supabase/migrations/001_initial.sql
```

### 4. Configurar autenticação (Supabase)
No painel do Supabase → **Authentication → URL Configuration**:
- Site URL: `https://poup.com.br`
- Redirect URLs: `https://poup.com.br/auth/callback`

Para desenvolvimento local, adicione também:
- `http://localhost:3000/auth/callback`

### 5. Configurar Resend (e-mail magic link)
1. Crie conta em [resend.com](https://resend.com)
2. Adicione e verifique o domínio `poup.com.br`
3. Crie uma API key e adicione ao `.env.local`
4. No Supabase → **Authentication → SMTP Settings**:
   - Host: `smtp.resend.com`
   - Port: `465`
   - User: `resend`
   - Password: `re_sua_api_key`
   - Sender: `noreply@poup.com.br`

---

## Rodar localmente
```bash
npm run dev
# Acesse: http://localhost:3000
```

## Deploy (Vercel)
```bash
vercel deploy
```
Configure as variáveis de ambiente no painel da Vercel.

---

## Estrutura das pastas
```
app/
  page.tsx              → Landing page
  auth-pages/           → Login e Signup (renomear para (auth) no deploy)
  app-pages/            → Dashboard, Transações, Upload (renomear para (app))
  auth/callback/        → Handler do magic link
  api/upload/           → API de importação CSV
  api/categorize/       → API de categorização IA (Pro)

components/
  layout/Sidebar.tsx    → Sidebar responsiva
  dashboard/            → Componentes do dashboard

lib/
  parsers/nubank.ts     → Parser CSV do Nubank
  analytics.ts          → Cálculos financeiros
  storytelling.ts       → Gerador de narrativa
  supabase/             → Clients (browser/server)
```

> ⚠️ **Nota sobre rotas:** As pastas `auth-pages` e `app-pages` devem ser renomeadas para `(auth)` e `(app)` respectivamente (com parênteses) para usar o Route Groups do Next.js. Os parênteses causam problema em alguns sistemas de arquivos, por isso foram omitidos neste template.

---

## Plano Pro — IA (futuro)
Quando tiver a API key da Anthropic:
1. Adicione `ANTHROPIC_API_KEY` no `.env.local`
2. Mude o `plan` do usuário para `'pro'` no Supabase
3. O endpoint `/api/categorize` estará disponível

---

## Exportar extrato do Nubank
- **Cartão:** App Nubank → Fatura → Exportar → CSV
- **Conta:** App Nubank → Extrato → Exportar → CSV

Ambos os formatos são detectados automaticamente.
