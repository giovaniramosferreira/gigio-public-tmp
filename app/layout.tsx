import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'POUP — Sua vida financeira em um só lugar',
  description: 'Importe seus extratos do Nubank e descubra o que está acontecendo com seu dinheiro. Dashboard inteligente com storytelling financeiro.',
  keywords: ['finanças pessoais', 'nubank', 'extrato', 'dashboard financeiro', 'controle financeiro'],
  openGraph: {
    title: 'POUP — Sua vida financeira em um só lugar',
    description: 'Importe seus extratos do Nubank e descubra o que está acontecendo com seu dinheiro.',
    url: 'https://poup.com.br',
    siteName: 'POUP',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ overflowX: 'hidden' }}>
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: '#1e0035',
              border: '1px solid rgba(138, 5, 190, 0.3)',
              color: '#f0e6ff',
            },
          }}
        />
      </body>
    </html>
  )
}
