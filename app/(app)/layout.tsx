import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="flex min-h-screen" style={{ background: '#0d001a' }}>
      <Sidebar profile={profile} userEmail={session.user.email || ''} />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  )
}
