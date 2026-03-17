import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserId } from '@/lib/auth'

// Save Instagram account credentials for a user
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { igUserId, accessToken } = await req.json()
  if (!igUserId || !accessToken) return NextResponse.json({ error: 'igUserId e accessToken obrigatórios' }, { status: 400 })

  // Validate the token with Instagram Graph API before saving
  const verifyRes = await fetch(
    `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
  )
  if (!verifyRes.ok) {
    return NextResponse.json({ error: 'Token inválido ou expirado. Verifique suas credenciais.' }, { status: 400 })
  }
  const igData = await verifyRes.json() as { id?: string; username?: string; error?: unknown }
  if (igData.error) {
    return NextResponse.json({ error: 'Token rejeitado pelo Instagram.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('instagram_accounts')
    .upsert({
      user_id: userId,
      ig_user_id: igUserId,
      access_token: accessToken,
      username: igData.username ?? null,
    }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, username: igData.username })
}

// Get saved Instagram account for the user
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('instagram_accounts')
    .select('ig_user_id, username, created_at')
    .eq('user_id', userId)
    .single()

  return NextResponse.json(data ?? null)
}

// Disconnect Instagram account
export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabaseAdmin.from('instagram_accounts').delete().eq('user_id', userId)
  return NextResponse.json({ ok: true })
}
