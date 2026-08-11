import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { parseNubankCSV, categorizeByRules } from '@/lib/parsers/nubank'

const MAX_UPLOADS_PER_HOUR = 20
const MAX_FILE_SIZE        = 10 * 1024 * 1024  // 10 MB
const MAX_ROWS             = 5_000

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // ── Auth: getUser() valida JWT contra servidor (getSession() não valida) ──
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // ── Rate limiting: max 20 uploads por hora (DB-backed, funciona em serverless) ──
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentUploads } = await supabase
    .from('statements')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('uploaded_at', oneHourAgo)

  if ((recentUploads ?? 0) >= MAX_UPLOADS_PER_HOUR) {
    return NextResponse.json(
      { error: `Limite de ${MAX_UPLOADS_PER_HOUR} uploads por hora atingido. Tente novamente mais tarde.` },
      { status: 429 }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    }

    // ── Validação de tamanho ──────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Arquivo maior que 10 MB' }, { status: 400 })
    }

    // ── Validação de extensão e MIME ──────────────────────────────────────
    const allowedMimes = ['text/csv', 'text/plain', 'application/vnd.ms-excel', 'application/octet-stream']
    if (!file.name.toLowerCase().endsWith('.csv') || !allowedMimes.includes(file.type)) {
      return NextResponse.json({ error: 'Arquivo deve ser um CSV válido' }, { status: 400 })
    }

    const text = await file.text()

    // ── Validação de conteúdo: mínimo de colunas Nubank ───────────────────
    const firstLine = text.split('\n')[0]?.toLowerCase() ?? ''
    const hasDateCol   = firstLine.includes('data') || firstLine.includes('date')
    const hasAmountCol = firstLine.includes('valor') || firstLine.includes('amount')
    if (!hasDateCol || !hasAmountCol) {
      return NextResponse.json(
        { error: 'Formato inválido. Envie um extrato CSV do Nubank.' },
        { status: 400 }
      )
    }

    // ── Limite de linhas ──────────────────────────────────────────────────
    const lineCount = text.split('\n').filter(l => l.trim()).length
    if (lineCount > MAX_ROWS + 1) {
      return NextResponse.json(
        { error: `Arquivo com muitas linhas (máx. ${MAX_ROWS} transações por arquivo)` },
        { status: 400 }
      )
    }

    const parsed      = parseNubankCSV(text)
    const categorized = parsed.map(t => ({
      ...t,
      category: categorizeByRules(t.description),
    }))

    const dates = categorized.map(t => t.date).sort()

    const { data: stmt, error: stmtErr } = await supabase
      .from('statements')
      .insert({
        user_id:        user.id,
        filename:       file.name,
        period_start:   dates[0],
        period_end:     dates[dates.length - 1],
        total_income:   categorized.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
        total_expenses: categorized.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0),
      })
      .select()
      .single()

    if (stmtErr) throw stmtErr

    // ── Insere em lotes de 100 ────────────────────────────────────────────
    const batchSize = 100
    let inserted = 0
    for (let i = 0; i < categorized.length; i += batchSize) {
      const batch = categorized.slice(i, i + batchSize).map(t => ({
        user_id:      user.id,
        statement_id: stmt.id,
        date:         t.date,
        description:  t.description,
        amount:       t.amount,
        type:         t.type,
        category:     t.category,
        category_ai:  false,
        raw_data:     t.raw_data,
      }))

      const { error: txErr } = await supabase.from('transactions').insert(batch)
      if (txErr) throw txErr
      inserted += batch.length
    }

    return NextResponse.json({ success: true, count: inserted, statementId: stmt.id })
  } catch (err: any) {
    // Não expõe detalhes internos em produção
    const isProd = process.env.NODE_ENV === 'production'
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: isProd ? 'Erro ao processar arquivo. Verifique o formato.' : (err.message || 'Erro interno') },
      { status: 500 }
    )
  }
}
