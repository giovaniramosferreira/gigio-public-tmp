'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Upload } from 'lucide-react'

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 20,
      }}>

      <p style={{ fontSize: 15, color: '#6b4d80', fontFamily: 'DM Sans' }}>
        Nenhum extrato importado ainda
      </p>

      <Link href="/upload" style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '14px 32px', borderRadius: 14, fontWeight: 600, fontSize: 15,
        background: 'linear-gradient(135deg, #8A05BE, #a83eff)',
        color: '#fff', fontFamily: 'Sora',
        boxShadow: '0 8px 32px rgba(138,5,190,0.45)',
        textDecoration: 'none',
      }}>
        <Upload size={18} />
        Importar extrato
      </Link>
    </motion.div>
  )
}
