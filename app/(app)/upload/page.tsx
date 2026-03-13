'use client'

import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { parseNubankCSV, categorizeByRules } from '@/lib/parsers/nubank'
import { toast } from 'sonner'
import { Upload, CheckCircle2, XCircle, FileText, Loader2 } from 'lucide-react'

type UploadStatus = 'idle' | 'parsing' | 'saving' | 'done' | 'error'

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [result, setResult] = useState<{ count: number; filename: string } | null>(null)
  const [error, setError] = useState('')

  async function processFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      toast.error('Apenas arquivos .csv são aceitos.')
      return
    }

    setStatus('parsing')
    setError('')

    try {
      const text = await file.text()
      const parsed = parseNubankCSV(text)

      const categorized = parsed.map(t => ({
        ...t,
        category: categorizeByRules(t.description),
      }))

      setStatus('saving')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Criar statement
      const dates = categorized.map(t => t.date).sort()
      const { data: stmt, error: stmtErr } = await supabase
        .from('statements')
        .insert({
          user_id: user.id,
          filename: file.name,
          period_start: dates[0],
          period_end: dates[dates.length - 1],
          total_income:   categorized.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
          total_expenses: categorized.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0),
        })
        .select()
        .single()

      if (stmtErr) throw stmtErr

      // Inserir transações em lotes de 100
      const batchSize = 100
      for (let i = 0; i < categorized.length; i += batchSize) {
        const batch = categorized.slice(i, i + batchSize).map(t => ({
          user_id: user.id,
          statement_id: stmt.id,
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
          category_ai: false,
          raw_data: t.raw_data,
        }))

        const { error: txErr } = await supabase.from('transactions').insert(batch)
        if (txErr) throw txErr
      }

      setResult({ count: categorized.length, filename: file.name })
      setStatus('done')
      toast.success(`${categorized.length} transações importadas com sucesso!`)
    } catch (err: any) {
      setError(err.message || 'Erro ao processar arquivo')
      setStatus('error')
      toast.error('Erro ao importar extrato.')
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
          Importar extrato
        </h1>
        <p className="text-sm mt-1" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
          Faça upload do CSV exportado pelo Nubank
        </p>
      </div>

      {/* How to export */}
      <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(138,5,190,0.08)', border: '1px solid rgba(138,5,190,0.2)' }}>
        <p className="text-xs font-semibold mb-1" style={{ fontFamily: 'Sora', color: '#d49dff' }}>Como exportar do Nubank</p>
        <ol className="text-xs space-y-0.5" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
          <li>1. Abra o app Nubank e vá em <strong style={{ color: '#f0e6ff' }}>Extrato</strong></li>
          <li>2. Toque em <strong style={{ color: '#f0e6ff' }}>Exportar extrato</strong></li>
          <li>3. Escolha o período e salve o arquivo <strong style={{ color: '#f0e6ff' }}>.csv</strong></li>
        </ol>
      </div>

      {/* Drop zone */}
      <AnimatePresence mode="wait">
        {status === 'idle' || status === 'error' ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <label
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="block cursor-pointer"
              style={{ cursor: 'pointer' }}>
              <div className="flex flex-col items-center justify-center gap-4 p-12 rounded-2xl transition-all"
                style={{
                  background: dragOver ? 'rgba(138,5,190,0.15)' : '#150025',
                  border: `2px dashed ${dragOver ? '#8A05BE' : 'rgba(138,5,190,0.3)'}`,
                  boxShadow: dragOver ? '0 0 30px rgba(138,5,190,0.2)' : 'none',
                }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: dragOver ? 'rgba(138,5,190,0.3)' : 'rgba(138,5,190,0.15)' }}>
                  <Upload size={28} style={{ color: '#d49dff' }} />
                </div>
                <div className="text-center">
                  <p className="font-semibold mb-1" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
                    Arraste o CSV aqui
                  </p>
                  <p className="text-sm" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                    ou clique para selecionar o arquivo
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full"
                  style={{ background: 'rgba(138,5,190,0.1)', color: '#9b7db8', fontFamily: 'DM Sans' }}>
                  Apenas .csv · Cartão ou Conta Nubank
                </span>
                <input type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
              </div>
            </label>

            {status === 'error' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-4 flex items-center gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                <p className="text-sm" style={{ color: '#fca5a5', fontFamily: 'DM Sans' }}>{error}</p>
              </motion.div>
            )}
          </motion.div>
        ) : status === 'parsing' || status === 'saving' ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-4 p-16 rounded-2xl"
            style={{ background: '#150025', border: '1px solid rgba(138,5,190,0.2)' }}>
            <Loader2 size={36} style={{ color: '#8A05BE' }} className="animate-spin" />
            <div className="text-center">
              <p className="font-semibold" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
                {status === 'parsing' ? 'Lendo arquivo...' : 'Salvando transações...'}
              </p>
              <p className="text-sm mt-1" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                {status === 'saving' ? 'Categorizando e salvando no banco...' : 'Processando CSV...'}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center gap-4 p-16 rounded-2xl"
            style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <CheckCircle2 size={48} style={{ color: '#22c55e' }} />
            <div className="text-center">
              <p className="text-xl font-bold mb-1" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
                {result?.count} transações importadas!
              </p>
              <p className="text-sm" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                <FileText size={12} className="inline mr-1" />
                {result?.filename}
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <a href="/dashboard"
                className="px-6 py-2.5 rounded-full text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #8A05BE, #a83eff)', color: '#fff', fontFamily: 'Sora' }}>
                Ver dashboard
              </a>
              <button onClick={() => setStatus('idle')}
                className="px-6 py-2.5 rounded-full text-sm font-medium"
                style={{ background: 'rgba(138,5,190,0.1)', border: '1px solid rgba(138,5,190,0.3)', color: '#d49dff', fontFamily: 'DM Sans' }}>
                Importar outro
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
