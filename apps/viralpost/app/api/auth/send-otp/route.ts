import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendOtpEmail } from '@/lib/email'

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
  }

  const normalized = email.trim().toLowerCase()

  // Rate limit: max 1 OTP per 60 seconds per email
  const { data: recent } = await supabaseAdmin
    .from('otp_codes')
    .select('created_at')
    .eq('email', normalized)
    .gte('created_at', new Date(Date.now() - 60_000).toISOString())
    .limit(1)
    .single()

  if (recent) {
    return NextResponse.json(
      { error: 'Aguarde 60 segundos antes de solicitar outro código.' },
      { status: 429 }
    )
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  await supabaseAdmin.from('otp_codes').insert({ email: normalized, code, expires_at: expiresAt })

  try {
    await sendOtpEmail(normalized, code)
  } catch (err: any) {
    return NextResponse.json({ error: `Erro ao enviar e-mail: ${err.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
