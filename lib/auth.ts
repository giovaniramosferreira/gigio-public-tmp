import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase'

/** Retorna o user_id do JWT Supabase enviado no header Authorization */
export async function getUserId(req: NextRequest): Promise<string | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user?.id ?? null
}
