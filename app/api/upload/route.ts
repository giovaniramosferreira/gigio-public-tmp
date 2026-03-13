import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { parseNubankCSV, categorizeByRules } from '@/lib/parsers/nubank'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file || !file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Arquivo CSV inválido' }, { status: 400 })
    }

    const text = await file.text()
    const parsed = parseNubankCSV(text)
    const categorized = parsed.map(t => ({
      ...t,
      category: categorizeByRules(t.description),
    }))

    const dates = categorized.map(t => t.date).sort()

    const { data: stmt, error: stmtErr } = await supabase
      .from('statements')
      .insert({
        user_id: session.user.id,
        filename: file.name,
        period_start: dates[0],
        period_end: dates[dates.length - 1],
        total_income:   categorized.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
        total_expenses: categorized.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0),
      })
      .select()
      .single()

    if (stmtErr) throw stmtErr

    // Insert in batches
    const batchSize = 100
    let inserted = 0
    for (let i = 0; i < categorized.length; i += batchSize) {
      const batch = categorized.slice(i, i + batchSize).map(t => ({
        user_id: session.user.id,
        statement_id: stmt.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        category_ai: false,
        raw_data: t.raw_data,
      }))

      const { error: txErr } = await supabase.from('transactions').insert(batch)
      if (txErr) throw txErr
      inserted += batch.length
    }

    return NextResponse.json({ success: true, count: inserted, statementId: stmt.id })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
