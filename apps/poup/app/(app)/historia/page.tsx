import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HistoriaClient from '@/components/historia/HistoriaClient'

export const dynamic = 'force-dynamic'

export default async function HistoriaPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, name')
    .eq('id', user.id)
    .single()

  return <HistoriaClient isPro={profile?.plan === 'pro'} userName={profile?.name ?? null} />
}
