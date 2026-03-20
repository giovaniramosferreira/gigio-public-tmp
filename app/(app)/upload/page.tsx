import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UploadClient from './UploadClient'

export const dynamic = 'force-dynamic'

export default async function UploadPage() {
  const supabase = createServerClient()

  // getUser() valida o JWT contra o servidor (getSession() apenas lê o cookie sem validar)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: statements } = await supabase
    .from('statements')
    .select('id, filename, period_start, period_end, total_income, total_expenses, uploaded_at, transactions(count)')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })

  return <UploadClient initialStatements={statements || []} />
}
