import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EXERCISES, MUSCLE_LABEL } from '../data/exercises'
import type { MuscleGroup } from '../types'

const GROUPS = Object.keys(MUSCLE_LABEL) as MuscleGroup[]

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export default function Library() {
  const [q, setQ] = useState('')
  const [group, setGroup] = useState<MuscleGroup | null>(null)

  const results = useMemo(() => {
    const nq = normalize(q.trim())
    return EXERCISES.filter((e) => {
      if (group && e.primary !== group) return false
      if (!nq) return true
      return (
        normalize(e.name).includes(nq) ||
        e.aliases.some((a) => normalize(a).includes(nq)) ||
        normalize(MUSCLE_LABEL[e.primary]).includes(nq)
      )
    }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [q, group])

  return (
    <div className="page fade-in">
      <h1>Biblioteca</h1>
      <input
        className="input" style={{ marginTop: 14 }}
        placeholder="Buscar exercício… (ex.: supino, remada)"
        value={q} onChange={(e) => setQ(e.target.value)}
      />
      <div style={{ marginTop: 12, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        <button className={`pill ${group === null ? 'accent' : ''}`} onClick={() => setGroup(null)}>Todos</button>
        {GROUPS.map((g) => (
          <button key={g} className={`pill ${group === g ? 'accent' : ''}`} style={{ whiteSpace: 'nowrap' }}
            onClick={() => setGroup(group === g ? null : g)}>
            {MUSCLE_LABEL[g]}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginTop: 14, padding: '4px 16px' }}>
        {results.length === 0 && (
          <div className="empty">
            <div className="big">🔍</div>
            <p className="small">Nada encontrado para "{q}". Tente outro nome — ex.: "terra", "extensora".</p>
          </div>
        )}
        {results.map((e) => (
          <Link key={e.id} to={`/exercise/${e.id}`} className="list-item">
            <div className="grow">
              <h3 style={{ fontSize: 15 }}>{e.name}</h3>
              <span className="tiny faint">{MUSCLE_LABEL[e.primary]}{e.loadType === 'bodyweight' ? ' · peso corporal' : ''}</span>
            </div>
            <span className="chev">›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
