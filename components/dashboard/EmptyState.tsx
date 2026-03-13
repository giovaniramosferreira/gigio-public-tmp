'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Upload, ArrowRight } from 'lucide-react'

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-24 px-6">

      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'rgba(138,5,190,0.15)', border: '1px solid rgba(138,5,190,0.3)' }}>
        <Upload size={32} style={{ color: '#d49dff' }} />
      </div>

      <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
        Nenhum extrato importado ainda
      </h2>
      <p className="text-sm max-w-md leading-relaxed mb-8" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
        Importe seu extrato CSV do Nubank para começar a visualizar sua vida financeira.
        O processo leva menos de 30 segundos.
      </p>

      <Link href="/upload"
        className="flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm"
        style={{ background: 'linear-gradient(135deg, #8A05BE, #a83eff)', color: '#fff', fontFamily: 'Sora', boxShadow: '0 8px 24px rgba(138,5,190,0.4)' }}>
        Importar extrato
        <ArrowRight size={16} />
      </Link>

      <div className="mt-12 p-4 rounded-xl max-w-sm"
        style={{ background: '#150025', border: '1px solid rgba(138,5,190,0.2)' }}>
        <p className="text-xs" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
          <strong style={{ color: '#d49dff' }}>Como exportar do Nubank:</strong>
          <br />No app Nubank → Menu → Extrato → Exportar CSV
        </p>
      </div>
    </motion.div>
  )
}
