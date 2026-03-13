'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { Profile } from '@/types'
import {
  LayoutDashboard, ListOrdered, Upload,
  LogOut, Menu, X, ChevronRight, Crown
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações',  icon: ListOrdered },
  { href: '/upload',       label: 'Importar',    icon: Upload },
]

interface SidebarProps {
  profile: Profile | null
  userEmail: string
}

export default function Sidebar({ profile, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-6" style={{ borderBottom: '1px solid rgba(138,5,190,0.15)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #8A05BE, #a83eff)' }}>
          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'Sora', color: '#fff' }}>P</span>
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Sora', color: '#f0e6ff' }}>POUP</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                fontFamily: 'DM Sans',
                background: active ? 'rgba(138,5,190,0.2)' : 'transparent',
                color: active ? '#d49dff' : '#9b7db8',
                border: active ? '1px solid rgba(138,5,190,0.3)' : '1px solid transparent',
              }}>
              <Icon size={18} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade banner (Free only) */}
      {profile?.plan === 'free' && (
        <div className="mx-3 mb-4 p-4 rounded-xl"
          style={{ background: 'linear-gradient(135deg, rgba(138,5,190,0.2), rgba(99,3,138,0.15))', border: '1px solid rgba(138,5,190,0.25)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Crown size={14} style={{ color: '#f59e0b' }} />
            <span className="text-xs font-semibold" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>Upgrade para Pro</span>
          </div>
          <p className="text-xs mb-3" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
            Categorização por IA e análise de 12 meses.
          </p>
          <button disabled className="w-full py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', fontFamily: 'Sora', cursor: 'not-allowed' }}>
            Em breve
          </button>
        </div>
      )}

      {/* User info + logout */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(138,5,190,0.15)', paddingTop: '12px' }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1"
          style={{ background: 'rgba(138,5,190,0.08)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8A05BE, #a83eff)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Sora', color: '#fff' }}>
              {(profile?.name || userEmail).charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-semibold truncate" style={{ fontFamily: 'DM Sans', color: '#f0e6ff' }}>
              {profile?.name || 'Usuário'}
            </div>
            <div className="text-xs truncate" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
              {userEmail}
            </div>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
          style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}
          onMouseOver={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseOut={e  => (e.currentTarget.style.color = '#9b7db8')}>
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(13,0,26,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(138,5,190,0.15)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8A05BE, #a83eff)' }}>
            <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'Sora', color: '#fff' }}>P</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Sora', color: '#f0e6ff' }}>POUP</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: '#9b7db8' }}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col"
        style={{ background: '#0d001a', borderRight: '1px solid rgba(138,5,190,0.15)' }}>
        <SidebarContent />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-72 z-50"
              style={{ background: '#0d001a', borderRight: '1px solid rgba(138,5,190,0.2)' }}>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
