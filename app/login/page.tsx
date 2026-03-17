'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

type Step = 'email' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOtp(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    })

    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
    setLoading(false)
  }

  async function handleVerifyOtp(e: React.SyntheticEvent) {
    e.preventDefault()
    if (otp.length < 6) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const inputStyle = {
    background: 'var(--bg-raised)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg text-black"
            style={{ background: 'var(--yellow)' }}>V</div>
          <span className="text-2xl font-bold tracking-tight">
            Viral<span style={{ color: 'var(--yellow)' }}>Post</span>
          </span>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

          {step === 'email' ? (
            <>
              <h1 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Entrar na sua conta
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Enviaremos um código de 6 dígitos para o seu e-mail.
              </p>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-muted)' }}>E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--yellow)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>

                {error && (
                  <p className="text-sm px-3 py-2 rounded-lg"
                    style={{ background: '#2a1111', color: '#f87171', border: '1px solid #3f1919' }}>
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  style={{ background: 'var(--yellow)', color: '#000' }}>
                  {loading ? 'Enviando...' : 'Enviar código'}
                </button>
              </form>
            </>
          ) : (
            <>
              <button onClick={() => { setStep('email'); setOtp(''); setError('') }}
                className="flex items-center gap-1.5 text-xs mb-5 transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}>
                ← Voltar
              </button>

              <h1 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Insira o código
              </h1>
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                Enviamos um código para
              </p>
              <p className="text-sm font-bold mb-6" style={{ color: 'var(--yellow)' }}>{email}</p>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  autoFocus
                  className="w-full px-4 py-4 rounded-xl text-2xl font-bold tracking-[0.5em] text-center outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--yellow)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />

                {error && (
                  <p className="text-sm px-3 py-2 rounded-lg"
                    style={{ background: '#2a1111', color: '#f87171', border: '1px solid #3f1919' }}>
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading || otp.length < 6}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  style={{ background: 'var(--yellow)', color: '#000' }}>
                  {loading ? 'Verificando...' : 'Entrar'}
                </button>

                <button type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full py-2 text-xs transition-opacity hover:opacity-70 disabled:opacity-30"
                  style={{ color: 'var(--text-muted)' }}>
                  Reenviar código
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Pipeline YouTube → Carrossel Instagram com IA
        </p>
      </div>
    </div>
  )
}
