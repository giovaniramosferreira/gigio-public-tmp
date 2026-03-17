import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { email, code } = await req.json()
  if (!email || !code) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const normalized = email.trim().toLowerCase()

  // Find valid, unused, non-expired OTP
  const { data: otp } = await supabaseAdmin
    .from('otp_codes')
    .select('id, code, expires_at, used')
    .eq('email', normalized)
    .eq('code', code.trim())
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!otp) {
    return NextResponse.json({ error: 'Código inválido ou expirado.' }, { status: 401 })
  }

  // Mark as used
  await supabaseAdmin.from('otp_codes').update({ used: true }).eq('id', otp.id)

  // Create or get Supabase user, then generate a session token
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: normalized,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json({ error: 'Erro ao criar sessão.' }, { status: 500 })
  }

  return NextResponse.json({ token_hash: linkData.properties.hashed_token })
}
