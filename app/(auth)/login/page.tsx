'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Mail, ArrowRight, Sparkles, KeyRound } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    background: '#0d001a',
    border: '1px solid rgba(138,5,190,0.3)',
    color: '#f0e6ff',
    fontFamily: 'DM Sans',
    outline: 'none',
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      toast.error('Erro ao enviar código. Tente novamente.')
    } else {
      setStep('code')
      toast.success('Código enviado! Verifique seu e-mail.')
    }
    setLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!code || code.length < 6) return
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    if (error) {
      toast.error('Código inválido ou expirado.')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 auth-bg">
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(138,5,190,0.2) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="fixed bottom-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,3,138,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10">

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

          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
                  Bem-vindo de volta 👋
                </h1>
                <p className="text-sm text-center mb-8" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                  Digite seu e-mail e enviaremos um código de acesso.
                </p>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'DM Sans', color: '#d49dff' }}>
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9b7db8' }} />
                      <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="seu@email.com" required
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                        style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = '#8A05BE')}
                        onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(138,5,190,0.3)')}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading || !email}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all"
                    style={{
                      background: loading ? 'rgba(138,5,190,0.4)' : 'linear-gradient(135deg, #8A05BE, #a83eff)',
                      color: '#fff', fontFamily: 'Sora',
                      boxShadow: '0 4px 20px rgba(138,5,190,0.3)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}>
                    {loading
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <> Enviar código <ArrowRight size={16} /> </>}
                  </button>
                </form>

                <p className="text-center text-sm mt-6" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                  Ainda não tem conta?{' '}
                  <Link href="/signup" style={{ color: '#d49dff' }} className="font-medium hover:underline">
                    Cadastre-se grátis
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(138,5,190,0.2)' }}>
                  <Sparkles size={28} style={{ color: '#d49dff' }} />
                </div>
                <h2 className="text-xl font-bold mb-2 text-center" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
                  Código enviado!
                </h2>
                <p className="text-sm text-center mb-8" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                  Enviamos um código de 6 dígitos para{' '}
                  <strong style={{ color: '#d49dff' }}>{email}</strong>
                </p>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'DM Sans', color: '#d49dff' }}>
                      Código de acesso
                    </label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9b7db8' }} />
                      <input
                        type="text" value={code}
                        onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000" required maxLength={6}
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-center tracking-[0.5em]"
                        style={{ ...inputStyle, fontSize: '1.25rem', letterSpacing: '0.5em' }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#8A05BE')}
                        onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(138,5,190,0.3)')}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading || code.length < 6}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all"
                    style={{
                      background: loading ? 'rgba(138,5,190,0.4)' : 'linear-gradient(135deg, #8A05BE, #a83eff)',
                      color: '#fff', fontFamily: 'Sora',
                      boxShadow: '0 4px 20px rgba(138,5,190,0.3)',
                      cursor: (loading || code.length < 6) ? 'not-allowed' : 'pointer',
                    }}>
                    {loading
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <> Entrar <ArrowRight size={16} /> </>}
                  </button>
                </form>

                <button onClick={() => { setStep('email'); setCode('') }}
                  className="w-full mt-4 text-sm text-center underline"
                  style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                  Usar outro e-mail
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
