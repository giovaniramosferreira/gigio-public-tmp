'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Mail, ArrowRight, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error('Erro ao enviar magic link. Tente novamente.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 auth-bg">
      {/* Background orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(138,5,190,0.2) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="fixed bottom-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,3,138,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8A05BE, #a83eff)' }}>
              <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Sora', color: '#fff' }}>P</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Sora', color: '#f0e6ff' }}>POUP</span>
          </Link>
        </div>

        <div className="p-8 rounded-2xl"
          style={{ background: '#150025', border: '1px solid rgba(138,5,190,0.25)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

          {!sent ? (
            <>
              <h1 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
                Bem-vindo de volta 👋
              </h1>
              <p className="text-sm text-center mb-8" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                Digite seu e-mail e enviaremos um link mágico para entrar.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'DM Sans', color: '#d49dff' }}>
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9b7db8' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all"
                      style={{
                        background: '#0d001a',
                        border: '1px solid rgba(138,5,190,0.3)',
                        color: '#f0e6ff',
                        fontFamily: 'DM Sans',
                        outline: 'none',
                      }}
                      onFocus={e  => (e.currentTarget.style.borderColor = '#8A05BE')}
                      onBlur={e   => (e.currentTarget.style.borderColor = 'rgba(138,5,190,0.3)')}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: loading ? 'rgba(138,5,190,0.4)' : 'linear-gradient(135deg, #8A05BE, #a83eff)',
                    color: '#fff',
                    fontFamily: 'Sora',
                    boxShadow: '0 4px 20px rgba(138,5,190,0.3)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}>
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Enviar magic link
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm mt-6" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                Ainda não tem conta?{' '}
                <Link href="/signup" style={{ color: '#d49dff' }} className="font-medium hover:underline">
                  Cadastre-se grátis
                </Link>
              </p>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(138,5,190,0.2)' }}>
                <Sparkles size={28} style={{ color: '#d49dff' }} />
              </div>
              <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
                Verifique seu e-mail!
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                Enviamos um link mágico para <strong style={{ color: '#d49dff' }}>{email}</strong>.
                <br />Clique nele para entrar — sem senha!
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm underline"
                style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                Tentar outro e-mail
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
