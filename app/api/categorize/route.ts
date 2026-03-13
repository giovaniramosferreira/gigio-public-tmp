import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Verificar plano Pro
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', session.user.id)
    .single()

  if (profile?.plan !== 'pro') {
    return NextResponse.json({ error: 'Recurso disponível apenas no plano Pro' }, { status: 403 })
  }

  // Verificar se a API key está configurada
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API de IA não configurada' }, { status: 500 })
  }

  try {
    const { transactionIds } = await req.json()

    // Buscar transações para categorizar
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, description, amount, type')
      .in('id', transactionIds)
      .eq('user_id', session.user.id)

    if (error) throw error
    if (!transactions?.length) {
      return NextResponse.json({ error: 'Nenhuma transação encontrada' }, { status: 404 })
    }

    // Importação dinâmica para não falhar se não houver API key
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `Você é um assistente financeiro brasileiro especializado em categorização de gastos.
    
Categorize cada transação em UMA das seguintes categorias:
Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Streaming, Mercado, Receita, Investimentos, Financeiro, Outros

Retorne APENAS um JSON array no formato: [{"id": "uuid", "category": "Categoria"}]
Sem texto extra, sem markdown, apenas o JSON.

Transações:
${JSON.stringify(transactions.map(t => ({ id: t.id, description: t.description, amount: t.amount, type: t.type })))}
`

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const categories = JSON.parse(responseText) as { id: string; category: string }[]

    // Atualizar transações no banco
    let updated = 0
    for (const cat of categories) {
      await supabase
        .from('transactions')
        .update({ category: cat.category, category_ai: true })
        .eq('id', cat.id)
        .eq('user_id', session.user.id)
      updated++
    }

    return NextResponse.json({ success: true, updated })
  } catch (err: any) {
    console.error('Categorize error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao categorizar' }, { status: 500 })
  }
}
