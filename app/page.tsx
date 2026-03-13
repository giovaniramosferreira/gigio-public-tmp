'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BarChart3, Shield, Zap, TrendingUp, Upload,
  ChevronRight, Star, CheckCircle2, ArrowRight
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.6, ease: 'easeOut' } },
}

const stagger = {
  show: { transition: { staggerChildren: 0.12 } },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0d001a' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(13,0,26,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(138,5,190,0.12)' }}>
        <PoupLogo />
        <nav className="hidden md:flex items-center gap-8">
          {['Funcionalidades', 'Preços', 'Segurança'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="text-sm font-medium transition-colors"
              style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}
              onMouseOver={e => (e.currentTarget.style.color = '#f0e6ff')}
              onMouseOut={e  => (e.currentTarget.style.color = '#9b7db8')}>
              {item}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login"
            className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
            style={{ color: '#d49dff', fontFamily: 'DM Sans' }}>
            Entrar
          </Link>
          <Link href="/signup"
            className="text-sm font-semibold px-5 py-2.5 rounded-full transition-all"
            style={{ background: 'linear-gradient(135deg, #8A05BE, #a83eff)', color: '#fff', fontFamily: 'Sora', boxShadow: '0 4px 20px rgba(138,5,190,0.4)' }}
            onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 32px rgba(138,5,190,0.7)')}
            onMouseOut={e  => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(138,5,190,0.4)')}>
            Começar grátis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-40 pb-28 overflow-hidden">
        {/* Orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(138,5,190,0.25) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,3,138,0.2) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <motion.div variants={stagger} initial="hidden" animate="show" className="relative z-10 max-w-4xl">
          <motion.div variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{ background: 'rgba(138,5,190,0.15)', border: '1px solid rgba(138,5,190,0.3)', color: '#d49dff', fontFamily: 'DM Sans' }}>
            <Star size={14} className="fill-current" />
            Grátis para começar · Sem cartão de crédito
          </motion.div>

          <motion.h1 variants={fadeUp}
            className="text-5xl md:text-7xl font-extrabold leading-tight mb-6"
            style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
            Sua vida financeira<br />
            <span style={{ background: 'linear-gradient(135deg, #d49dff 0%, #8A05BE 50%, #a83eff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              finalmente clara.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
            Importe seus extratos do Nubank e descubra, com storytelling visual inteligente,
            onde seu dinheiro realmente vai — e como mudar isso.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup"
              className="group flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #8A05BE, #a83eff)', color: '#fff', fontFamily: 'Sora', boxShadow: '0 8px 32px rgba(138,5,190,0.45)' }}>
              Criar conta grátis
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-full text-base font-medium transition-all"
              style={{ background: 'rgba(138,5,190,0.1)', border: '1px solid rgba(138,5,190,0.3)', color: '#d49dff', fontFamily: 'DM Sans' }}>
              Já tenho conta
            </Link>
          </motion.div>
        </motion.div>

        {/* Dashboard preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          className="relative mt-20 w-full max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#150025', border: '1px solid rgba(138,5,190,0.3)', boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(138,5,190,0.1)' }}>
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3"
              style={{ background: '#1e0035', borderBottom: '1px solid rgba(138,5,190,0.15)' }}>
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div className="ml-4 px-4 py-1 rounded-full text-xs"
                style={{ background: 'rgba(138,5,190,0.1)', color: '#9b7db8', fontFamily: 'DM Sans' }}>
                poup.com.br/dashboard
              </div>
            </div>
            {/* Dashboard preview */}
            <DashboardPreview />
          </div>
          {/* Glow under */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2/3 h-16"
            style={{ background: 'radial-gradient(ellipse, rgba(138,5,190,0.4) 0%, transparent 70%)', filter: 'blur(20px)' }} />
        </motion.div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
              Tudo que você precisa,
              <span className="gradient-text"> sem complicação</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
              Do upload do extrato ao insight financeiro em menos de 30 segundos.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl"
                style={{ background: '#150025', border: '1px solid rgba(138,5,190,0.2)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(138,5,190,0.2)' }}>
                  <f.icon size={22} style={{ color: '#d49dff' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preços" className="px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
              Simples e transparente
            </h2>
            <p className="text-lg" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>Sem pegadinhas. Cancele quando quiser.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="p-8 rounded-2xl" style={{ background: '#150025', border: '1px solid rgba(138,5,190,0.2)' }}>
              <div className="text-sm font-semibold mb-2" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>PLANO</div>
              <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>Gratuito</div>
              <div className="text-4xl font-extrabold mb-6" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>R$ 0<span className="text-lg font-normal" style={{ color: '#9b7db8' }}>/mês</span></div>
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map(f => <PricingItem key={f} text={f} />)}
              </ul>
              <Link href="/signup" className="block text-center py-3 rounded-full font-semibold transition-all"
                style={{ background: 'rgba(138,5,190,0.15)', border: '1px solid rgba(138,5,190,0.3)', color: '#d49dff', fontFamily: 'Sora' }}>
                Começar grátis
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="p-8 rounded-2xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1e0035, #2d0050)', border: '1px solid rgba(168,62,255,0.5)', boxShadow: '0 8px 40px rgba(138,5,190,0.25)' }}>
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #8A05BE, #a83eff)', color: '#fff', fontFamily: 'Sora' }}>
                EM BREVE
              </div>
              <div className="text-sm font-semibold mb-2" style={{ color: '#d49dff', fontFamily: 'DM Sans' }}>PLANO</div>
              <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>Pro</div>
              <div className="text-4xl font-extrabold mb-6" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>R$ 19<span className="text-lg font-normal" style={{ color: '#9b7db8' }}>/mês</span></div>
              <ul className="space-y-3 mb-8">
                {PRO_FEATURES.map(f => <PricingItem key={f} text={f} highlight />)}
              </ul>
              <button disabled className="w-full py-3 rounded-full font-semibold"
                style={{ background: 'linear-gradient(135deg, #8A05BE, #a83eff)', color: '#fff', fontFamily: 'Sora', opacity: 0.7, cursor: 'not-allowed' }}>
                Em breve
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-2xl mx-auto p-12 rounded-3xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e0035, #2d0050)', border: '1px solid rgba(168,62,255,0.3)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(138,5,190,0.2) 0%, transparent 70%)' }} />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
            Comece a entender<br />seu dinheiro hoje.
          </h2>
          <p className="mb-8 relative z-10" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
            Cadastro em 30 segundos. Sem senha. Sem cartão de crédito.
          </p>
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold relative z-10"
            style={{ background: 'linear-gradient(135deg, #8A05BE, #a83eff)', color: '#fff', fontFamily: 'Sora', boxShadow: '0 8px 32px rgba(138,5,190,0.5)' }}>
            Criar conta gratuita
            <ChevronRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center" style={{ borderTop: '1px solid rgba(138,5,190,0.1)' }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <PoupLogo />
        </div>
        <p className="text-sm" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
          © {new Date().getFullYear()} POUP. Feito com 💜 no Brasil.
        </p>
      </footer>
    </div>
  )
}

function PoupLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #8A05BE, #a83eff)' }}>
        <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Sora', color: '#fff' }}>P</span>
      </div>
      <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Sora', color: '#f0e6ff', letterSpacing: '-0.03em' }}>
        POUP
      </span>
    </div>
  )
}

function PricingItem({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <li className="flex items-center gap-3 text-sm" style={{ fontFamily: 'DM Sans', color: highlight ? '#f0e6ff' : '#9b7db8' }}>
      <CheckCircle2 size={16} style={{ color: '#8A05BE', flexShrink: 0 }} />
      {text}
    </li>
  )
}

function DashboardPreview() {
  return (
    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Receitas', value: 'R$ 5.200', color: '#22c55e' },
        { label: 'Gastos',   value: 'R$ 3.847', color: '#ef4444' },
        { label: 'Saldo',    value: 'R$ 1.353', color: '#8A05BE' },
        { label: 'Maior gasto', value: 'R$ 890', color: '#f59e0b' },
      ].map(card => (
        <div key={card.label} className="p-4 rounded-xl" style={{ background: '#1e0035', border: '1px solid rgba(138,5,190,0.2)' }}>
          <div className="text-xs mb-2" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>{card.label}</div>
          <div className="text-lg font-bold" style={{ fontFamily: 'Sora', color: card.color }}>{card.value}</div>
        </div>
      ))}
      <div className="col-span-2 md:col-span-4 p-4 rounded-xl" style={{ background: 'rgba(138,5,190,0.1)', border: '1px solid rgba(138,5,190,0.25)' }}>
        <p className="text-sm" style={{ color: '#d49dff', fontFamily: 'DM Sans' }}>
          <span style={{ fontWeight: 600, fontFamily: 'Sora' }}>🎉 Mês ótimo!</span> Em Junho, você gastou <strong>R$ 3.847</strong> — 12% a menos que maio. Sua maior categoria foi <strong>Alimentação</strong> (R$ 1.200 · 31%).
        </p>
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: Upload,     title: 'Upload de extrato Nubank',   description: 'Importe seu CSV do Nubank (cartão ou conta) com um clique. Detectamos o formato automaticamente.' },
  { icon: BarChart3,  title: 'Dashboard com storytelling', description: 'Não só gráficos — um resumo narrativo que explica o que aconteceu com seu dinheiro no mês.' },
  { icon: Shield,     title: 'Seus dados só seus',          description: 'Autenticação por magic link. Sem senhas. Cada usuário vê somente os próprios dados (RLS no Supabase).' },
  { icon: TrendingUp, title: 'Categorização inteligente',  description: 'No plano Pro, a IA categoriza cada gasto automaticamente para insights ainda mais precisos.' },
  { icon: Zap,        title: 'Login sem senha',            description: 'Magic link no e-mail. Você cadastra nome, e-mail e telefone — e pronto. Simples assim.' },
  { icon: BarChart3,  title: 'Análise por categoria',      description: 'Veja exatamente onde vai seu dinheiro com gráficos de donut, listas e filtros por mês.' },
]

const FREE_FEATURES = [
  'Dashboard com resumo mensal',
  'Upload de extratos CSV Nubank',
  'Categorização automática por regras',
  'Gráfico de gastos por categoria',
  'Histórico de transações',
  'Login por magic link (sem senha)',
]

const PRO_FEATURES = [
  'Tudo do plano gratuito',
  'Categorização por Inteligência Artificial',
  'Análise de 12 meses com gráfico de evolução',
  'Previsão de gastos para o próximo mês',
  'Relatório financeiro em PDF',
  'Categorias personalizadas',
]
