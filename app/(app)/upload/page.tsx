'use client'

import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { parseNubankCSV, categorizeByRules } from '@/lib/parsers/nubank'
import { toast } from 'sonner'
import { Upload, CheckCircle2, XCircle, FileText, Loader2 } from 'lucide-react'

const MAX_FILES = 100

type FileResult = { filename: string; count: number; error?: string }
type UploadStatus = 'idle' | 'processing' | 'done'

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<FileResult[]>([])
  const [error, setError] = useState('')

  async function processFiles(files: File[]) {
    const csvFiles = files.filter(f => f.name.endsWith('.csv'))
    if (csvFiles.length === 0) {
      toast.error('Nenhum arquivo .csv encontrado.')
      return
    }
    if (csvFiles.length > MAX_FILES) {
      toast.error(`Máximo de ${MAX_FILES} arquivos por vez.`)
      return
    }

    setStatus('processing')
    setError('')
    setResults([])
    setProgress({ current: 0, total: csvFiles.length })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Usuário não autenticado')
      setStatus('idle')
      return
    }

    const fileResults: FileResult[] = []

    for (let i = 0; i < csvFiles.length; i++) {
      const file = csvFiles[i]
      setProgress({ current: i + 1, total: csvFiles.length })

      try {
        const text = await file.text()
        const parsed = parseNubankCSV(text)
        const categorized = parsed.map(t => ({
          ...t,
          category: categorizeByRules(t.description),
        }))

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

        const batchSize = 100
        for (let j = 0; j < categorized.length; j += batchSize) {
          const batch = categorized.slice(j, j + batchSize).map(t => ({
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

        fileResults.push({ filename: file.name, count: categorized.length })
      } catch (err: any) {
        fileResults.push({ filename: file.name, count: 0, error: err.message || 'Erro ao processar' })
      }
    }

    setResults(fileResults)
    setStatus('done')

    const success = fileResults.filter(r => !r.error).length
    const failed  = fileResults.filter(r => r.error).length
    const total   = fileResults.reduce((s, r) => s + r.count, 0)

    if (failed === 0) toast.success(`${total} transações importadas de ${success} arquivo${success !== 1 ? 's' : ''}!`)
    else toast.warning(`${success} ok, ${failed} com erro.`)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) processFiles(files)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length) processFiles(files)
  }

  const successCount = results.filter(r => !r.error).length
  const failCount    = results.filter(r => r.error).length
  const totalTxs     = results.reduce((s, r) => s + r.count, 0)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
          Importar extratos
        </h1>
        <p className="text-sm mt-1" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
          Faça upload de até {MAX_FILES} arquivos CSV do Nubank de uma vez
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

      <AnimatePresence mode="wait">
        {status === 'idle' || (status === 'done' && results.length === 0) ? (
          <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <label
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="block cursor-pointer">
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
                    Arraste os CSVs aqui
                  </p>
                  <p className="text-sm" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                    ou clique para selecionar os arquivos
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full"
                  style={{ background: 'rgba(138,5,190,0.1)', color: '#9b7db8', fontFamily: 'DM Sans' }}>
                  Até {MAX_FILES} arquivos .csv por vez
                </span>
                <input type="file" accept=".csv" multiple className="hidden" onChange={handleFileInput} />
              </div>
            </label>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-4 flex items-center gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                <p className="text-sm" style={{ color: '#fca5a5', fontFamily: 'DM Sans' }}>{error}</p>
              </motion.div>
            )}
          </motion.div>

        ) : status === 'processing' ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-5 p-16 rounded-2xl"
            style={{ background: '#150025', border: '1px solid rgba(138,5,190,0.2)' }}>
            <Loader2 size={36} style={{ color: '#8A05BE' }} className="animate-spin" />
            <div className="text-center">
              <p className="font-semibold" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
                Processando arquivos...
              </p>
              <p className="text-sm mt-1" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                {progress.current} de {progress.total}
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-xs rounded-full overflow-hidden" style={{ background: 'rgba(138,5,190,0.15)', height: 6 }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #8A05BE, #a83eff)' }}
                initial={{ width: 0 }}
                animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>

        ) : (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            {/* Summary */}
            <div className="flex flex-col items-center gap-3 p-8 rounded-2xl mb-4"
              style={{ background: failCount === 0 ? 'rgba(34,197,94,0.05)' : 'rgba(234,179,8,0.05)', border: `1px solid ${failCount === 0 ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}` }}>
              <CheckCircle2 size={40} style={{ color: failCount === 0 ? '#22c55e' : '#eab308' }} />
              <div className="text-center">
                <p className="text-xl font-bold mb-1" style={{ fontFamily: 'Sora', color: '#f0e6ff' }}>
                  {totalTxs} transações importadas!
                </p>
                <p className="text-sm" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                  {successCount} arquivo{successCount !== 1 ? 's' : ''} processado{successCount !== 1 ? 's' : ''}
                  {failCount > 0 && ` · ${failCount} com erro`}
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <a href="/dashboard"
                  className="px-6 py-2.5 rounded-full text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, #8A05BE, #a83eff)', color: '#fff', fontFamily: 'Sora' }}>
                  Ver dashboard
                </a>
                <button onClick={() => { setStatus('idle'); setResults([]) }}
                  className="px-6 py-2.5 rounded-full text-sm font-medium"
                  style={{ background: 'rgba(138,5,190,0.1)', border: '1px solid rgba(138,5,190,0.3)', color: '#d49dff', fontFamily: 'DM Sans' }}>
                  Importar mais
                </button>
              </div>
            </div>

            {/* File list */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#150025', border: '1px solid rgba(138,5,190,0.2)' }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(138,5,190,0.15)' }}>
                <p className="text-xs font-semibold" style={{ fontFamily: 'DM Sans', color: '#9b7db8' }}>
                  ARQUIVOS PROCESSADOS
                </p>
              </div>
              <div className="divide-y max-h-72 overflow-y-auto" style={{ borderColor: 'rgba(138,5,190,0.1)' }}>
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    {r.error
                      ? <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                      : <CheckCircle2 size={16} style={{ color: '#22c55e', flexShrink: 0 }} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ fontFamily: 'DM Sans', color: '#f0e6ff' }}>{r.filename}</p>
                      {r.error && <p className="text-xs truncate" style={{ color: '#fca5a5' }}>{r.error}</p>}
                    </div>
                    {!r.error && (
                      <span className="text-xs flex-shrink-0" style={{ color: '#9b7db8', fontFamily: 'DM Sans' }}>
                        {r.count} transações
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
