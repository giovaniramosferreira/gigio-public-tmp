import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { VALID_CATEGORIES } from '@/lib/categories'

const BATCH = 25

type TxRow = { id: string; description: string; amount: number; type: string; date: string }

// Remove "Parcela X/Y", espaços extras e lowercase — para matching de recorrentes
function normalizeDesc(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/\s*[-–]\s*parcela\s+\d+\/\d+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildPrompt(batch: TxRow[], examples: { description: string; category: string }[]) {
  const examplesBlock = examples.length > 0
    ? `\nExemplos de classificações anteriores deste usuário (use como referência prioritária):\n${examples.map(e => `- "${e.description}" → ${e.category}`).join('\n')}\n`
    : ''

  return `Você é um assistente financeiro brasileiro. Categorize cada transação em EXATAMENTE UMA categoria.
Use "Outros" SOMENTE quando for impossível determinar com confiança.

Categorias: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Streaming, Mercado, Receita, Investimentos, Financeiro, Compras online, Pets, Outros

Regras fixas:
- iFood, Rappi, restaurante, lanchonete, pizzaria → Alimentação
- Uber, 99, ônibus, metrô, combustível, estacionamento, pedágio → Transporte
- Netflix, Spotify, Disney, Prime, HBO, Deezer → Streaming
- Farmácia, hospital, médico, dentista, academia, plano de saúde → Saúde
- Supermercado, Carrefour, Extra, Pão de Açúcar, Atacadão → Mercado
- Aluguel, condomínio, energia, água, gás, internet, telefone → Moradia
- Escola, curso, faculdade, Udemy, Alura → Educação
- Cinema, viagem, hotel, bar, show, festa → Lazer
- Nubank, fatura, cartão, banco, IOF, tarifa → Financeiro
- CDB, XP, BTG, tesouro, ações, fundos → Investimentos
- Mercado Livre, MercadoLivre, Amazon, Shopee, AliExpress, Shein, Magazine Luiza, Magalu → Compras online
- Pet shop, veterinário, ração, banho e tosa, petshop, animal → Pets
- Salário, pix recebido, transferência recebida → Receita
- Sábado(weekday=6) ou domingo(weekday=0) + valor R$20-500 sem descrição clara → Lazer
- Valor >R$1000 sem contexto → Moradia, Financeiro ou Investimentos
${examplesBlock}
Retorne APENAS JSON array: [{"id":"uuid","category":"Categoria"}]
Sem markdown, sem texto extra.

Transações:
${JSON.stringify(batch.map(t => ({
  id: t.id,
  description: t.description,
  amount: t.amount,
  weekday: new Date(t.date + 'T12:00:00').getDay(),
})))}`
}

const MAX_TRANSACTION_IDS = 500

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // ── Auth: getUser() valida JWT contra servidor (getSession() não valida) ──
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (profile?.plan !== 'pro') {
    return NextResponse.json({ error: 'Recurso disponível apenas no plano Pro' }, { status: 403 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Serviço de IA não disponível' }, { status: 503 })
  }

  try {
    const { transactionIds } = await req.json()

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json({ error: 'transactionIds inválido' }, { status: 400 })
    }

    // ── Limite de IDs por chamada (protege contra custo excessivo de IA) ──
    if (transactionIds.length > MAX_TRANSACTION_IDS) {
      return NextResponse.json(
        { error: `Máximo de ${MAX_TRANSACTION_IDS} transações por chamada` },
        { status: 400 }
      )
    }

    // ── Valida que todos IDs são strings (evita injeção) ──────────────────
    if (!transactionIds.every((id: unknown) => typeof id === 'string' && id.length < 100)) {
      return NextResponse.json({ error: 'transactionIds inválido' }, { status: 400 })
    }

    // ── 1. Busca transações alvo e histórico em paralelo ─────────────────
    const [{ data: transactions, error }, { data: history }] = await Promise.all([
      supabase.from('transactions')
        .select('id, description, amount, type, date')
        .in('id', transactionIds)
        .eq('user_id', user.id),   // ← garante que só busca do próprio usuário
      supabase.from('transactions')
        .select('description, category')
        .eq('user_id', user.id)
        .neq('category', 'Outros')
        .not('statement_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000),
    ])

    if (error) throw error
    if (!transactions?.length) {
      return NextResponse.json({ error: 'Nenhuma transação encontrada' }, { status: 404 })
    }

    // ── 2. Processa histórico em passagem única: knownMap + freqMap ───────
    const knownMap = new Map<string, string>()
    const freqMap  = new Map<string, { category: string; count: number }>()

    for (const tx of history || []) {
      if (!tx.category || !VALID_CATEGORIES.has(tx.category)) continue
      // knownMap: normalizado → categoria (mais recente vence)
      const normKey = normalizeDesc(tx.description)
      if (!knownMap.has(normKey)) knownMap.set(normKey, tx.category)
      // freqMap: descrição original → frequência
      const entry = freqMap.get(tx.description)
      if (entry) { entry.count++ } else { freqMap.set(tx.description, { category: tx.category, count: 1 }) }
    }

    // ── 3. Separa: match direto no histórico vs. precisa da IA ───────────
    const preClassified: { id: string; category: string }[] = []
    const needsAI: TxRow[]                                  = []

    for (const tx of transactions as TxRow[]) {
      const known = knownMap.get(normalizeDesc(tx.description))
      if (known) {
        preClassified.push({ id: tx.id, category: known })
      } else {
        needsAI.push(tx)
      }
    }

    console.log(`[categorize] histórico: ${knownMap.size} padrões | direto: ${preClassified.length} | IA: ${needsAI.length}`)

    // ── 4. Monta exemplos para o prompt (top 30 mais frequentes) ─────────
    const examples = Array.from(freqMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 30)
      .map(([description, { category }]) => ({ description, category }))

    // ── 5. Chama IA apenas para o que não foi resolvido pelo histórico ────
    let aiResults: { id: string; category: string }[] = []

    if (needsAI.length > 0) {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 30_000 })

      const batches: TxRow[][] = []
      for (let i = 0; i < needsAI.length; i += BATCH) {
        batches.push(needsAI.slice(i, i + BATCH))
      }

      const batchResults = await Promise.all(
        batches.map(async batch => {
          const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 4096,
            messages: [{ role: 'user', content: buildPrompt(batch, examples) }],
          })
          const text    = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
          const cleaned = text.replace(/```(?:json)?\s*/gi, '').trim()
          try {
            const match = cleaned.match(/\[[\s\S]*\]/)
            return JSON.parse(match ? match[0] : cleaned) as { id: string; category: string }[]
          } catch {
            console.error('[categorize] Parse error, batch skipped. Preview:', cleaned.slice(0, 120))
            return []
          }
        })
      )

      for (const cats of batchResults) {
        for (const cat of cats) {
          if (cat.id && cat.category && VALID_CATEGORIES.has(cat.category)) {
            aiResults.push(cat)
          }
        }
      }
    }

    // ── 6. Une resultados: histórico + IA ────────────────────────────────
    const allResults = [...preClassified, ...aiResults]

    return NextResponse.json({
      success: true,
      results: allResults,
      meta: { fromHistory: preClassified.length, fromAI: aiResults.length },
    })
  } catch (err: any) {
    // Não expõe detalhes internos (ex: response da Anthropic com dados sensíveis)
    const isProd = process.env.NODE_ENV === 'production'
    console.error('Categorize error:', isProd ? '[redacted]' : err)
    return NextResponse.json(
      { error: isProd ? 'Erro ao categorizar. Tente novamente.' : (err.message || 'Erro ao categorizar') },
      { status: 500 }
    )
  }
}
