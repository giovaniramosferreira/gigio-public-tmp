'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { parseNubankCSV, categorizeByRules } from '@/lib/parsers/nubank'
import { toast } from 'sonner'
import { Upload, X, Check, CloudUpload, AlertTriangle } from 'lucide-react'

// ── Palette ────────────────────────────────────────────────────────────────
const BG     = '#0d001a'
const SURF   = '#180030'
const PURPLE = '#8A05BE'
const PURPL  = '#d49dff'
const TEXT   = '#f0e6ff'
const MUTED  = '#9b7db8'
const BORDER = '1px solid rgba(138,5,190,0.25)'

const MAX_FILES = 200

// ── Types ──────────────────────────────────────────────────────────────────
interface Statement {
  id: string
  filename: string
  period_start: string
  period_end: string
  total_income: number
  total_expenses: number
  uploaded_at: string
  transactions?: { count: number }[]
}

type RowStatus = 'ready' | 'importing' | 'error' | 'duplicate'

interface Row {
  id: string            // statement id (existing) or tmp id (uploading)
  filename: string
  period: string
  txCount?: number
  status: RowStatus
  progress?: number     // 0-100 while importing
  errorMsg?: string
  existing: boolean     // already in DB
}

// ── Helpers ────────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtPeriod(start: string, end: string) {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  if (sy === ey && sm === em) return `${MONTHS[sm - 1]} ${sy}`
  if (sy === ey) return `${MONTHS[sm - 1]} – ${MONTHS[em - 1]} ${sy}`
  return `${MONTHS[sm - 1]} ${sy} – ${MONTHS[em - 1]} ${ey}`
}

function stmtToRow(s: Statement): Row {
  return {
    id: s.id,
    filename: s.filename,
    period: fmtPeriod(s.period_start, s.period_end),
    txCount: s.transactions?.[0]?.count ?? 0,
    status: 'ready',
    existing: true,
  }
}

// ── Component ──────────────────────────────────────────────────────────────
export default function UploadClient({ initialStatements }: { initialStatements: Statement[] }) {
  const router = useRouter()
  const [dragOver, setDragOver] = useState(false)
  const [rows,     setRows]     = useState<Row[]>(initialStatements.map(stmtToRow))
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  // ── Checkbox helpers ───────────────────────────────────────────────────
  const readyRows  = rows.filter(r => r.existing)
  const allChecked = readyRows.length > 0 && selected.size === readyRows.length
  const someChecked = selected.size > 0 && !allChecked

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allChecked
      ? new Set()
      : new Set(readyRows.map(r => r.id))
    )
  }

  // ── Upload ─────────────────────────────────────────────────────────────
  const MAX_FILE_SIZE_MB = 10
  const MAX_FILE_SIZE    = MAX_FILE_SIZE_MB * 1024 * 1024

  async function processFiles(files: File[]) {
    const csvFiles = files.filter(f => f.name.endsWith('.csv'))
    if (!csvFiles.length) { toast.error('Apenas arquivos .csv são suportados.'); return }
    if (csvFiles.length > MAX_FILES) { toast.error(`Máximo de ${MAX_FILES} arquivos.`); return }

    const oversized = csvFiles.filter(f => f.size > MAX_FILE_SIZE)
    if (oversized.length) {
      toast.error(`Arquivo(s) muito grande(s). Máximo ${MAX_FILE_SIZE_MB}MB por arquivo.`)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Usuário não autenticado.'); return }

    // Detect duplicates against existing rows
    const existingNames = new Set(rows.filter(r => r.existing).map(r => r.filename))
    const duplicates    = csvFiles.filter(f => existingNames.has(f.name))
    const toImport      = csvFiles.filter(f => !existingNames.has(f.name))

    // Add duplicate rows immediately (won't be imported)
    const dupRows: Row[] = duplicates.map(f => ({
      id: `dup-${f.name}-${Date.now()}`,
      filename: f.name,
      period: '—',
      status: 'duplicate',
      existing: false,
    }))

    if (duplicates.length) {
      toast.warning(`${duplicates.length} arquivo${duplicates.length !== 1 ? 's' : ''} já importado${duplicates.length !== 1 ? 's' : ''} anteriormente.`)
      setRows(prev => [...dupRows, ...prev])
    }

    if (!toImport.length) return

    // Add rows in "importing" state
    const tmpRows: Row[] = toImport.map(f => ({
      id: `tmp-${f.name}-${Date.now()}`,
      filename: f.name,
      period: '—',
      status: 'importing',
      progress: 0,
      existing: false,
    }))
    setRows(prev => [...tmpRows, ...prev.filter(r => !dupRows.find(d => d.id === r.id))])

    for (let i = 0; i < toImport.length; i++) {
      const file   = toImport[i]
      const tmpId  = tmpRows[i].id

      const setProgress = (p: number) =>
        setRows(prev => prev.map(r => r.id === tmpId ? { ...r, progress: p } : r))

      try {
        setProgress(20)
        const parsed     = parseNubankCSV(await file.text())
        const categorized = parsed.map(t => ({ ...t, category: categorizeByRules(t.description) }))
        const dates      = categorized.map(t => t.date).sort()
        setProgress(40)

        const { data: stmt, error: stmtErr } = await supabase
          .from('statements')
          .insert({
            user_id:        user.id,
            filename:       file.name,
            period_start:   dates[0],
            period_end:     dates[dates.length - 1],
            total_income:   categorized.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
            total_expenses: categorized.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0),
          })
          .select()
          .single()

        if (stmtErr) throw stmtErr
        setProgress(60)

        for (let j = 0; j < categorized.length; j += 100) {
          const { error: txErr } = await supabase.from('transactions').insert(
            categorized.slice(j, j + 100).map(t => ({
              user_id: user.id, statement_id: stmt.id,
              date: t.date, description: t.description,
              amount: t.amount, type: t.type,
              category: t.category, category_ai: false, raw_data: t.raw_data,
            }))
          )
          if (txErr) throw txErr
          setProgress(60 + Math.round(((j + 100) / categorized.length) * 35))
        }

        // Replace tmp row with real row
        setRows(prev => prev.map(r => r.id === tmpId
          ? { id: stmt.id, filename: file.name, period: fmtPeriod(stmt.period_start, stmt.period_end), status: 'ready', existing: true }
          : r
        ))
        toast.success(`${file.name} importado com sucesso!`)
        router.refresh()

      } catch (err: any) {
        setRows(prev => prev.map(r => r.id === tmpId
          ? { ...r, status: 'error', errorMsg: err.message || 'Erro ao processar' }
          : r
        ))
        toast.error(`Erro em ${file.name}: ${err.message}`)
      }
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    processFiles(Array.from(e.dataTransfer.files))
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files || []))
  }

  // ── Delete selected ────────────────────────────────────────────────────
  async function handleDelete() {
    if (!selected.size) return
    setDeleting(true)
    const ids = Array.from(selected)

    const { error } = await supabase.from('statements').delete().in('id', ids)

    if (error) {
      toast.error('Erro ao apagar: ' + error.message)
    } else {
      toast.success(`${ids.length} extrato${ids.length !== 1 ? 's' : ''} apagado${ids.length !== 1 ? 's' : ''}.`)
      setRows(prev => prev.filter(r => !ids.includes(r.id)))
      setSelected(new Set())
      router.refresh()
    }
    setDeleting(false)
  }

  // ── Delete single row error ────────────────────────────────────────────
  function removeErrorRow(id: string) {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Sora', color: TEXT }}>
          Importar Documentos
        </h1>
        <p className="text-sm mt-1" style={{ color: MUTED, fontFamily: 'DM Sans' }}>
          Importe e gerencie seus extratos bancários em formato CSV do Nubank.
        </p>
      </div>

      {/* Dropzone */}
      <label
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="block cursor-pointer">
        <div
          className="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl transition-all"
          style={{
            border: `2px dashed ${dragOver ? PURPLE : 'rgba(138,5,190,0.4)'}`,
            background: dragOver ? 'rgba(138,5,190,0.1)' : 'rgba(138,5,190,0.04)',
            boxShadow: dragOver ? '0 0 40px rgba(138,5,190,0.15)' : 'none',
          }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(138,5,190,0.15)' }}>
            <CloudUpload size={26} style={{ color: PURPL }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm" style={{ fontFamily: 'Sora', color: TEXT }}>
              Arraste arquivos aqui ou clique para navegar
            </p>
            <p className="text-xs mt-0.5" style={{ color: MUTED, fontFamily: 'DM Sans' }}>
              (Formato suportado: CSV do Nubank. Até {MAX_FILES} arquivos por lote.)
            </p>
          </div>
          <input type="file" accept=".csv" multiple className="hidden" onChange={handleInput} />
        </div>
      </label>

      {/* File list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: SURF, border: BORDER }}>

        {/* List header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: BORDER }}>
          <span className="font-semibold text-sm" style={{ fontFamily: 'Sora', color: TEXT }}>
            Lista de Arquivos
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(138,5,190,0.2)', color: PURPL, fontFamily: 'DM Sans' }}>
              {rows.length}
            </span>
          </span>

          <AnimatePresence>
            {selected.size > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                  fontFamily: 'DM Sans',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}>
                <X size={14} />
                {deleting ? 'Excluindo...' : `Excluir Selecionados (${selected.size})`}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Table header */}
        {rows.length > 0 && (
          <div className="grid items-center px-5 py-2.5 text-xs font-semibold"
            style={{
              gridTemplateColumns: '32px 36px 1fr 140px 90px 100px 40px',
              color: MUTED,
              fontFamily: 'DM Sans',
              letterSpacing: '0.05em',
              borderBottom: '1px solid rgba(138,5,190,0.1)',
            }}>
            <Checkbox checked={allChecked} indeterminate={someChecked} onChange={toggleAll} />
            <span>Tipo</span>
            <span>Nome</span>
            <span>Período</span>
            <span>Transações</span>
            <span>Status</span>
            <span>Ações</span>
          </div>
        )}

        {/* Rows */}
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14"
            style={{ color: MUTED, fontFamily: 'DM Sans', fontSize: 14 }}>
            <Upload size={30} style={{ opacity: 0.35 }} />
            <span>Nenhum extrato importado ainda</span>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(138,5,190,0.08)', maxHeight: 380, overflowY: 'auto' }}>
            <AnimatePresence initial={false}>
              {rows.map(row => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16, height: 0, paddingTop: 0, paddingBottom: 0 }}
                  transition={{ duration: 0.18 }}
                  className="grid items-center px-5 py-3"
                  style={{
                    gridTemplateColumns: '32px 36px 1fr 140px 90px 100px 40px',
                    background: selected.has(row.id) ? 'rgba(138,5,190,0.07)' : 'transparent',
                    cursor: row.existing ? 'pointer' : 'default',
                  }}
                  onClick={() => row.existing && toggleOne(row.id)}>

                  {/* Checkbox */}
                  <div onClick={e => e.stopPropagation()}>
                    {row.existing
                      ? <Checkbox checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} />
                      : <div className="w-4 h-4" />}
                  </div>

                  {/* Type badge */}
                  <div>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontFamily: 'DM Sans' }}>
                      CSV
                    </span>
                  </div>

                  {/* Filename */}
                  <p className="text-sm truncate pr-2" style={{ fontFamily: 'DM Sans', color: TEXT }}>
                    {row.filename}
                  </p>

                  {/* Period */}
                  <p className="text-xs" style={{ color: MUTED, fontFamily: 'DM Sans' }}>
                    {row.period}
                  </p>

                  {/* Tx count */}
                  <p className="text-xs" style={{ color: row.txCount ? TEXT : MUTED, fontFamily: 'DM Sans' }}>
                    {row.txCount != null ? row.txCount.toLocaleString('pt-BR') : '—'}
                  </p>

                  {/* Status */}
                  <div>
                    {row.status === 'ready' && (
                      <span className="flex items-center gap-1 text-xs font-medium"
                        style={{ color: '#4ade80', fontFamily: 'DM Sans' }}>
                        <Check size={12} />
                        Pronto
                      </span>
                    )}
                    {row.status === 'importing' && (
                      <div>
                        <p className="text-xs mb-1" style={{ color: PURPL, fontFamily: 'DM Sans' }}>
                          Importando... {row.progress ?? 0}%
                        </p>
                        <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(138,5,190,0.2)' }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #8A05BE, #d49dff)' }}
                            animate={{ width: `${row.progress ?? 0}%` }}
                            transition={{ duration: 0.3 }} />
                        </div>
                      </div>
                    )}
                    {row.status === 'error' && (
                      <span className="text-xs" style={{ color: '#f87171', fontFamily: 'DM Sans' }}>
                        Erro
                      </span>
                    )}
                    {row.status === 'duplicate' && (
                      <span className="flex items-center gap-1 text-xs font-medium"
                        style={{ color: '#fb923c', fontFamily: 'DM Sans' }}>
                        <AlertTriangle size={11} />
                        Duplicado
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-center" onClick={e => e.stopPropagation()}>
                    {(row.status === 'error' || row.status === 'duplicate') ? (
                      <button onClick={() => removeErrorRow(row.id)}
                        className="p-1 rounded-lg transition-colors"
                        style={{ color: row.status === 'duplicate' ? '#fb923c' : '#f87171' }}
                        title={row.status === 'duplicate' ? 'Arquivo já importado anteriormente' : row.errorMsg}>
                        <X size={15} />
                      </button>
                    ) : row.existing ? (
                      <button
                        onClick={() => {
                          setSelected(new Set([row.id]))
                          handleDelete()
                        }}
                        className="p-1 rounded-lg transition-colors"
                        style={{ color: MUTED }}
                        onMouseOver={e => (e.currentTarget.style.color = '#f87171')}
                        onMouseOut={e  => (e.currentTarget.style.color = MUTED)}>
                        <X size={15} />
                      </button>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Footer */}
        {rows.length > 0 && (
          <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(138,5,190,0.08)' }}>
            <p className="text-xs" style={{ color: MUTED, fontFamily: 'DM Sans' }}>
              {rows.filter(r => r.existing).length} extrato{rows.filter(r => r.existing).length !== 1 ? 's' : ''} importado{rows.filter(r => r.existing).length !== 1 ? 's' : ''}.
              {selected.size > 0 && ` · ${selected.size} selecionado${selected.size !== 1 ? 's' : ''}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Checkbox ───────────────────────────────────────────────────────────────
function Checkbox({ checked, indeterminate, onChange }: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
}) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange() }}
      className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all"
      style={{
        background: checked || indeterminate ? '#8A05BE' : 'transparent',
        border: `1.5px solid ${checked || indeterminate ? '#8A05BE' : 'rgba(138,5,190,0.45)'}`,
      }}>
      {indeterminate && !checked && (
        <span style={{ width: 8, height: 2, background: '#fff', borderRadius: 1, display: 'block' }} />
      )}
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
