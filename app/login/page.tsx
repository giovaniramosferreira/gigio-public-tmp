'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
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
          {!sent ? (
            <>
              <h1 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Entrar na sua conta
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Enviaremos um link de acesso para o seu e-mail. Sem senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-muted)' }}>E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
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
                  {loading ? '⏳ Enviando...' : '✉ Enviar link de acesso'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Verifique seu e-mail
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Enviamos um link de acesso para
              </p>
              <p className="text-sm font-bold mb-6" style={{ color: 'var(--yellow)' }}>{email}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Clique no link do e-mail para entrar. Pode fechar esta aba.
              </p>
              <button onClick={() => setSent(false)}
                className="mt-6 text-xs underline"
                style={{ color: 'var(--text-muted)' }}>
                Usar outro e-mail
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Pipeline YouTube → Carrossel Instagram com IA
        </p>
      </div>
    </div>
  )
}
