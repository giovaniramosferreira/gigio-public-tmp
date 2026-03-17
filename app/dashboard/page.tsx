'use client'
import { useEffect, useRef, useState } from 'react'
import CarouselPreview from '@/components/CarouselPreview'
import PostCard from '@/components/PostCard'
import { createClient } from '@/lib/supabase-client'
import { STYLE_LIST, type StyleId } from '@/lib/styles'

type SortKey = 'view_count' | 'like_count' | 'comment_count' | 'published_at' | 'like_view_ratio' | 'subscriber_count'
type SortDir = 'asc' | 'desc'
type Mode = 'trending' | 'search' | 'url'
type NavTab = 'videos' | 'posts' | 'settings'

interface Video {
  id: string
  youtube_id: string
  title: string
  channel_name: string
  thumbnail_url: string
  view_count: number
  like_count: number
  comment_count: number
  duration: string
  published_at: string
  processed: boolean
  subscriber_count: number
  like_view_ratio: number
}

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '-'
  const h = parseInt(match[1] || '0')
  const m = parseInt(match[2] || '0')
  const s = parseInt(match[3] || '0')
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return String(n)
}

const DEFAULT_KEYWORDS = [
  'documentary mystery',
  'the science behind',
  'unsolved mysteries',
  'history of everyday things',
  'the real story behind',
].join('\n')

export default function Dashboard() {
  const supabase = createClient()

  const [tab, setTab] = useState<NavTab>('videos')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)

  const [posts, setPosts] = useState<any[]>([])
  const [stats, setStats] = useState({ totalPosts: 0, totalVideos: 0, postsToday: 0 })
  const [niches, setNiches] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  // Search
  const [mode, setMode] = useState<Mode>('trending')
  const [selectedNiche, setSelectedNiche] = useState('')
  const [keywordsText, setKeywordsText] = useState(DEFAULT_KEYWORDS)
  const [minLikeRatio, setMinLikeRatio] = useState(0)
  const [minSubs, setMinSubs] = useState(0)
  const [maxSubs, setMaxSubs] = useState(0)
  const [maxResults, setMaxResults] = useState(25)
  const [language, setLanguage] = useState('en')

  // Table
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [fetching, setFetching] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('like_view_ratio')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // URL mode
  const [urlInput, setUrlInput] = useState('')
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [urlVideoPreview, setUrlVideoPreview] = useState<Video | null>(null)

  // Style picker
  const [selectedStyle, setSelectedStyle] = useState<StyleId>('dark-gold')

  // Generation
  const [generatingRowId, setGeneratingRowId] = useState<string | null>(null)
  const [generatingBatch, setGeneratingBatch] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [genError, setGenError] = useState('')
  const [inlinePost, setInlinePost] = useState<any>(null)
  const inlineRef = useRef<HTMLDivElement>(null)

  // Instagram settings
  const [igAccount, setIgAccount] = useState<{ ig_user_id: string; username: string } | null>(null)
  const [igUserId, setIgUserId] = useState('')
  const [igToken, setIgToken] = useState('')
  const [igSaving, setIgSaving] = useState(false)
  const [igMsg, setIgMsg] = useState('')

  // Load auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserEmail(session.user.email ?? null)
        setAuthToken(session.access_token)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user.email ?? null)
      setAuthToken(session?.access_token ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load data once we have token
  useEffect(() => {
    if (!authToken) return
    fetchPosts()
    fetchStats()
    fetchIgAccount()
    fetch('/api/niches')
      .then((r) => r.ok ? r.json() : [])
      .then((d) => Array.isArray(d) ? setNiches(d) : null)
      .catch(() => null)
  }, [authToken])

  async function authHeaders() {
    // Refresh session if needed
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? authToken
    return {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    }
  }

  async function fetchPosts() {
    setLoading(true)
    try {
      const headers = await authHeaders()
      const r = await fetch('/api/posts', { headers })
      const d = await r.json()
      setPosts(Array.isArray(d) ? d : [])
    } catch { setPosts([]) }
    setLoading(false)
  }

  async function fetchStats() {
    try {
      const headers = await authHeaders()
      const r = await fetch('/api/stats', { headers })
      const d = await r.json()
      if (d && typeof d.totalPosts === 'number') setStats(d)
    } catch {}
  }

  async function fetchIgAccount() {
    try {
      const headers = await authHeaders()
      const r = await fetch('/api/instagram/connect', { headers })
      if (r.ok) {
        const d = await r.json()
        setIgAccount(d)
      }
    } catch {}
  }

  async function fetchVideos() {
    setFetching(true)
    setInlinePost(null)
    try {
      const keywords = keywordsText.split('\n').map((k) => k.trim()).filter(Boolean)
      const body: any = { mode, nicheId: selectedNiche || null }
      if (mode === 'search') {
        body.keywords = keywords
        body.maxResultsPerQuery = maxResults
        body.minLikeRatio = minLikeRatio
        body.minSubscribers = minSubs
        body.maxSubscribers = maxSubs
        body.language = language
      }
      const headers = await authHeaders()
      const res = await fetch('/api/videos/fetch', { method: 'POST', headers, body: JSON.stringify(body) })
      const data = await res.json()
      setVideos(Array.isArray(data) ? data : [])
      setSelectedIds(new Set())
    } catch (err) { console.error(err) }
    setFetching(false)
  }

  async function fetchFromUrl() {
    if (!urlInput.trim()) return
    setFetchingUrl(true)
    setUrlError('')
    setUrlVideoPreview(null)
    try {
      const headers = await authHeaders()
      const res = await fetch('/api/videos/from-url', {
        method: 'POST', headers, body: JSON.stringify({ url: urlInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) setUrlError(data.error || 'Erro ao buscar vídeo')
      else { setUrlVideoPreview(data); setUrlInput('') }
    } catch { setUrlError('Erro de conexão') }
    setFetchingUrl(false)
  }

  async function apiPost(path: string, body: any) {
    const headers = await authHeaders()
    const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `Erro em ${path}`)
    return data
  }

  async function generateSingle(videoId: string) {
    setGeneratingRowId(videoId)
    setInlinePost(null)
    setGenError('')
    try {
      setProgressMsg('📄 Buscando transcrição do vídeo...')
      const { text: transcript } = await apiPost('/api/generate/transcript', { videoId })

      setProgressMsg('✨ Gerando slides com IA...')
      const carousel = await apiPost('/api/generate/ai', { videoId, transcript })

      setProgressMsg('🖼 Buscando imagens no Unsplash...')
      const { slides } = await apiPost('/api/generate/images', { slides: carousel.slides })

      setProgressMsg('💾 Salvando...')
      const { post } = await apiPost('/api/generate/save', {
        videoId, slides,
        caption: carousel.caption,
        hashtags: carousel.hashtags,
        hashtagGroups: carousel.hashtagGroups,
        firstComment: carousel.firstComment,
        style: selectedStyle,
      })

      setProgressMsg('')
      setVideos((v) => v.map((vid) => vid.id === videoId ? { ...vid, processed: true } : vid))
      setUrlVideoPreview(null)
      if (post) {
        setInlinePost(post)
        setTimeout(() => inlineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      }
      await fetchStats()
    } catch (err: any) {
      setProgressMsg('')
      setGenError(err.message || 'Erro desconhecido')
    }
    setGeneratingRowId(null)
  }

  async function generateBatch() {
    if (selectedIds.size === 0) return
    setGeneratingBatch(true)
    setInlinePost(null)
    const ids = Array.from(selectedIds)
    for (const videoId of ids) {
      await generateSingle(videoId)
    }
    setSelectedIds(new Set())
    await fetchPosts()
    setGeneratingBatch(false)
  }

  async function saveIgAccount() {
    if (!igUserId.trim() || !igToken.trim()) return
    setIgSaving(true)
    setIgMsg('')
    try {
      const headers = await authHeaders()
      const res = await fetch('/api/instagram/connect', {
        method: 'POST', headers, body: JSON.stringify({ igUserId: igUserId.trim(), accessToken: igToken.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setIgMsg(`❌ ${data.error}`) }
      else {
        setIgMsg(`✅ Conta @${data.username} conectada!`)
        setIgAccount({ ig_user_id: igUserId.trim(), username: data.username })
        setIgUserId('')
        setIgToken('')
      }
    } catch { setIgMsg('❌ Erro de conexão') }
    setIgSaving(false)
  }

  async function disconnectIg() {
    if (!confirm('Desconectar conta do Instagram?')) return
    const headers = await authHeaders()
    await fetch('/api/instagram/connect', { method: 'DELETE', headers })
    setIgAccount(null)
    setIgMsg('')
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    const unprocessed = sortedVideos.filter((v) => !v.processed)
    if (selectedIds.size === unprocessed.length && unprocessed.length > 0) setSelectedIds(new Set())
    else setSelectedIds(new Set(unprocessed.map((v) => v.id)))
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const sortedVideos = [...videos].sort((a, b) => {
    const av = sortKey === 'published_at' ? new Date(a[sortKey]).getTime() : (a[sortKey] as number)
    const bv = sortKey === 'published_at' ? new Date(b[sortKey]).getTime() : (b[sortKey] as number)
    return sortDir === 'desc' ? bv - av : av - bv
  })

  const unprocessedCount = sortedVideos.filter((v) => !v.processed).length
  const allSelected = selectedIds.size === unprocessedCount && unprocessedCount > 0
  const isGenerating = !!generatingRowId || generatingBatch
  const kwCount = keywordsText.split('\n').filter(Boolean).length

  function Th({ label, k, right = true }: { label: string; k: SortKey; right?: boolean }) {
    const active = sortKey === k
    return (
      <th onClick={() => handleSort(k)}
        className={`px-4 py-3 ${right ? 'text-right' : 'text-left'} font-medium cursor-pointer whitespace-nowrap select-none text-xs uppercase tracking-wider transition-colors ${active ? 'text-[#ffd000]' : 'text-[#555] hover:text-[#999]'}`}
      >
        {label} <span className={active ? 'text-[#ffd000]' : 'text-[#333]'}>{active ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
      </th>
    )
  }

  function ratioColor(r: number) {
    if (r >= 10) return 'text-[#ffd000] font-bold'
    if (r >= 5)  return 'text-[#c9a600] font-semibold'
    if (r >= 2)  return 'text-[#888]'
    return 'text-[#555]'
  }

  const currentStyleDef = STYLE_LIST.find((s) => s.id === selectedStyle)!

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* ── NAV ── */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-screen-xl mx-auto px-6 flex items-stretch h-14 gap-8">
          <div className="flex items-center gap-2.5 pr-8" style={{ borderRight: '1px solid var(--border)' }}>
            <div className="w-7 h-7 rounded flex items-center justify-center text-black font-black text-sm" style={{ background: 'var(--yellow)' }}>V</div>
            <span className="font-bold tracking-tight text-base">Viral<span style={{ color: 'var(--yellow)' }}>Post</span></span>
          </div>
          <div className="flex items-stretch gap-0">
            {[
              { key: 'videos',   label: '🎬 Vídeos' },
              { key: 'posts',    label: `📱 Posts (${stats.totalPosts})` },
              { key: 'settings', label: '⚙ Config' },
            ].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key as NavTab)}
                className="px-5 text-sm font-medium transition-colors relative"
                style={{ color: tab === t.key ? 'var(--yellow)' : 'var(--text-secondary)', borderBottom: tab === t.key ? '2px solid var(--yellow)' : '2px solid transparent' }}
              >{t.label}</button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-6 text-sm">
            {[{ label: 'Posts', value: stats.totalPosts }, { label: 'Hoje', value: stats.postsToday }, { label: 'Vídeos', value: stats.totalVideos }].map((s) => (
              <div key={s.label} className="flex items-baseline gap-1.5">
                <span className="font-bold text-base" style={{ color: 'var(--yellow)' }}>{s.value}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
              </div>
            ))}
            {userEmail && (
              <div className="flex items-center gap-2 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{userEmail}</span>
                <button onClick={logout}
                  className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                  style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >Sair</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6">

        {/* ── TAB VÍDEOS ── */}
        {tab === 'videos' && (
          <div>
            {/* Config panel */}
            <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              {/* Mode toggle */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Modo</span>
                <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-base)' }}>
                  {[{ key: 'trending', label: '🔥 Trending' }, { key: 'search', label: '💎 Hidden Gems' }, { key: 'url', label: '🔗 URL Direta' }].map((m) => (
                    <button key={m.key} onClick={() => { setMode(m.key as Mode); setUrlVideoPreview(null); setInlinePost(null) }}
                      className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                      style={mode === m.key ? { background: 'var(--yellow)', color: '#000', fontWeight: 700 } : { color: 'var(--text-secondary)' }}
                    >{m.label}</button>
                  ))}
                </div>
              </div>

              {/* URL mode */}
              {mode === 'url' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input type="text" value={urlInput}
                      onChange={(e) => { setUrlInput(e.target.value); setUrlError('') }}
                      onKeyDown={(e) => e.key === 'Enter' && fetchFromUrl()}
                      placeholder="https://www.youtube.com/watch?v=...  ou  https://youtu.be/..."
                      className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-all"
                      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--yellow)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                    />
                    <button onClick={fetchFromUrl} disabled={fetchingUrl || !urlInput.trim()}
                      className="px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-40"
                      style={{ background: 'var(--yellow)', color: '#000' }}
                    >{fetchingUrl ? '⏳ Buscando...' : '🔗 Carregar'}</button>
                  </div>
                  {urlError && <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#2a1111', color: '#f87171', border: '1px solid #3f1919' }}>⚠ {urlError}</p>}

                  {urlVideoPreview && (
                    <div className="rounded-xl p-4 flex gap-4 items-center" style={{ background: 'var(--bg-raised)', border: '1px solid rgba(255,208,0,0.2)' }}>
                      <img src={urlVideoPreview.thumbnail_url} alt="" className="w-32 h-20 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-tight line-clamp-2 mb-1" style={{ color: 'var(--text-primary)' }}>{urlVideoPreview.title}</p>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{urlVideoPreview.channel_name}</p>
                        <div className="flex gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span>👁 {fmt(urlVideoPreview.view_count)}</span>
                          <span>👍 {fmt(urlVideoPreview.like_count)}</span>
                          <span>📊 {(urlVideoPreview.like_view_ratio || 0).toFixed(1)}%</span>
                          <span>👥 {fmt(urlVideoPreview.subscriber_count || 0)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => generateSingle(urlVideoPreview.id)}
                          disabled={isGenerating}
                          className="px-5 py-2.5 rounded-lg text-sm font-bold disabled:opacity-40 transition-all"
                          style={{ background: 'var(--yellow)', color: '#000' }}
                        >
                          {isGenerating ? '⏳ Gerando...' : '✨ Gerar Carrossel'}
                        </button>
                        <button onClick={() => setUrlVideoPreview(null)} className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                          Carregar outro
                        </button>
                      </div>
                    </div>
                  )}
                  {!urlVideoPreview && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Suporta: youtube.com/watch?v= · youtu.be/ · /shorts/ · /embed/</p>}
                </div>
              )}

              {/* Trending mode */}
              {mode === 'trending' && (
                <div className="flex items-center gap-3">
                  <select value={selectedNiche} onChange={(e) => setSelectedNiche(e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    <option value="">Todos os nichos</option>
                    {niches.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Top 20 vídeos populares do YouTube BR no momento</p>
                </div>
              )}

              {/* Hidden Gems */}
              {mode === 'search' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Keywords <span style={{ textTransform: 'none' }}>(uma por linha)</span></label>
                    <textarea value={keywordsText} onChange={(e) => setKeywordsText(e.target.value)} rows={5}
                      className="w-full px-3 py-2 rounded-lg text-sm font-mono resize-none outline-none transition-all"
                      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--yellow)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                      placeholder="documentary mystery&#10;the science behind"
                    />
                    <div className="flex items-center gap-3 mt-2">
                      <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Idioma:</label>
                      <select value={language} onChange={(e) => setLanguage(e.target.value)}
                        className="px-2 py-1 rounded-lg text-xs outline-none"
                        style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                        <option value="en">🇺🇸 Inglês</option>
                        <option value="pt">🇧🇷 Português</option>
                        <option value="es">🇪🇸 Espanhol</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Resultados por keyword', val: maxResults, set: setMaxResults, min: 5, max: 50, step: 5, fmt: (v: number) => `${v} vídeos`, marks: ['5','15','25','35','50'] },
                      { label: 'Engajamento mínimo', val: minLikeRatio, set: setMinLikeRatio, min: 0, max: 20, step: 0.5, fmt: (v: number) => v === 0 ? 'OFF' : `≥ ${v}%`, marks: ['OFF','5%','10%','15%','20%'] },
                      { label: 'Mínimo de inscritos', val: minSubs, set: setMinSubs, min: 0, max: 1000000, step: 5000, fmt: (v: number) => v === 0 ? 'OFF' : `≥ ${fmt(v)}`, marks: ['OFF','100K','300K','600K','1M'] },
                      { label: 'Máximo de inscritos', val: maxSubs, set: setMaxSubs, min: 0, max: 10000000, step: 50000, fmt: (v: number) => v === 0 ? 'OFF' : `≤ ${fmt(v)}`, marks: ['OFF','1M','3M','6M','10M'] },
                    ].map(({ label, val, set, min, max, step, fmt: fmtVal, marks }) => (
                      <div key={label}>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</label>
                          <span className="text-sm font-bold" style={{ color: val === 0 && min === 0 ? 'var(--text-muted)' : 'var(--yellow)' }}>{fmtVal(val)}</span>
                        </div>
                        <input type="range" min={min} max={max} step={step} value={val}
                          onChange={(e) => (set as any)(min === 0 && step < 1 ? parseFloat(e.target.value) : Number(e.target.value))}
                          className="w-full" style={{ accentColor: 'var(--yellow)' }} />
                        <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {marks.map((m) => <span key={m}>{m}</span>)}
                        </div>
                      </div>
                    ))}
                    <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      ⚡ {kwCount} keywords × ~102 = <span style={{ color: 'var(--yellow)' }}>{kwCount * 102}</span> cotas <span style={{ color: 'var(--text-muted)' }}>(limite: 10k/dia)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Style picker + action bar */}
              <div className="flex items-start gap-4 mt-5 pt-5 flex-wrap" style={{ borderTop: '1px solid var(--border)' }}>
                {/* Style picker */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Estilo visual</p>
                  <div className="flex gap-2">
                    {STYLE_LIST.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStyle(s.id)}
                        title={s.description}
                        className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all"
                        style={selectedStyle === s.id
                          ? { border: `2px solid ${s.accentColor}`, background: 'var(--bg-raised)' }
                          : { border: '2px solid var(--border)', background: 'transparent', opacity: 0.6 }
                        }
                      >
                        <div className="w-8 h-8 rounded-lg" style={{ background: s.preview }} />
                        <span className="text-xs font-medium leading-tight text-center" style={{ color: selectedStyle === s.id ? s.accentColor : 'var(--text-muted)', maxWidth: 60 }}>
                          {s.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fetch button */}
                {mode !== 'url' && (
                  <div className="flex items-center gap-3 mt-auto ml-auto">
                    <button onClick={fetchVideos} disabled={fetching}
                      className="px-6 py-2.5 rounded-lg text-sm font-bold disabled:opacity-40"
                      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >{fetching ? '⏳ Buscando...' : mode === 'search' ? '💎 Buscar Hidden Gems' : '🔥 Buscar Trending'}</button>

                    {selectedIds.size > 0 && (
                      <button onClick={generateBatch} disabled={isGenerating}
                        className="px-6 py-2.5 rounded-lg text-sm font-bold disabled:opacity-40"
                        style={{ background: 'var(--yellow)', color: '#000' }}
                      >{generatingBatch ? '⏳ Gerando...' : `✨ Gerar Carrosséis (${selectedIds.size})`}</button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {isGenerating && progressMsg && (
              <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3"
                style={{ background: 'rgba(255,208,0,0.07)', border: '1px solid rgba(255,208,0,0.2)' }}>
                <span className="inline-block w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0"
                  style={{ borderColor: 'rgba(255,208,0,0.2)', borderTopColor: 'var(--yellow)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--yellow)' }}>{progressMsg}</span>
              </div>
            )}

            {/* Error */}
            {genError && (
              <div className="mb-4 px-4 py-3 rounded-xl flex items-start gap-3"
                style={{ background: '#2a1111', border: '1px solid #3f1919' }}>
                <span className="text-base flex-shrink-0">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-0.5" style={{ color: '#f87171' }}>Erro ao gerar carrossel</p>
                  <p className="text-xs" style={{ color: '#fca5a5' }}>{genError}</p>
                </div>
                <button onClick={() => setGenError('')}
                  className="text-xs px-2 py-1 rounded flex-shrink-0"
                  style={{ background: '#3f1919', color: '#f87171' }}>✕</button>
              </div>
            )}

            {/* Inline result */}
            {inlinePost && (
              <div ref={inlineRef} className="mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,208,0,0.3)' }}>
                <div className="flex items-center justify-between px-5 py-3" style={{ background: 'rgba(255,208,0,0.07)', borderBottom: '1px solid rgba(255,208,0,0.2)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold" style={{ color: 'var(--yellow)' }}>✓ Carrossel gerado!</span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{inlinePost.trending_videos?.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setTab('posts'); fetchPosts() }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'var(--yellow)', color: '#000' }}>
                      Ver todos os posts →
                    </button>
                    <button onClick={() => setInlinePost(null)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>✕</button>
                  </div>
                </div>
                <div className="p-5" style={{ background: 'var(--bg-surface)' }}>
                  <div className="max-w-sm mx-auto">
                    <CarouselPreview
                      slides={inlinePost.slides}
                      caption={inlinePost.caption}
                      hashtags={inlinePost.hashtags}
                      hashtagGroups={inlinePost.hashtag_groups}
                      firstComment={inlinePost.first_comment}
                      styleId={inlinePost.style}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Videos table */}
            {videos.length === 0 && mode !== 'url' ? (
              <div className="text-center py-24" style={{ color: 'var(--text-muted)' }}>
                <p className="text-5xl mb-4">{mode === 'search' ? '💎' : '🔍'}</p>
                {!fetching && (
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {mode === 'search' ? 'Configure as keywords e clique em "Buscar Hidden Gems"' : 'Clique em "Buscar Trending"'}
                    </p>
                    {mode === 'search' && minLikeRatio > 3 && (
                      <p className="text-xs mt-3 px-4 py-2 rounded-xl inline-block" style={{ background: '#2a1f00', color: '#fbbf24', border: '1px solid #3a2a00' }}>
                        💡 Taxa de {minLikeRatio}% é alta. Tente baixar o slider.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : videos.length > 0 && (
              <div className="rounded-xl overflow-x-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{videos.length}</span> vídeos encontrados
                    {mode === 'search' && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--yellow-glow)', color: 'var(--yellow)', border: '1px solid rgba(255,208,0,0.2)' }}>💎 Hidden Gems</span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>⚡ gera direto · ▶ assiste primeiro · ☑ seleciona vários</p>
                </div>
                <table className="w-full text-sm">
                  <thead style={{ borderBottom: '1px solid var(--border)' }}>
                    <tr style={{ background: 'var(--bg-raised)' }}>
                      <th className="px-4 py-3 w-10">
                        <input type="checkbox" checked={allSelected} onChange={toggleAll}
                          className="rounded cursor-pointer" style={{ accentColor: 'var(--yellow)' }} />
                      </th>
                      <Th label="Vídeo" k="view_count" right={false} />
                      <Th label="Engaj. %" k="like_view_ratio" />
                      <Th label="Views" k="view_count" />
                      <Th label="Likes" k="like_count" />
                      <Th label="Coments." k="comment_count" />
                      <Th label="Inscritos" k="subscriber_count" />
                      <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>Dur.</th>
                      <Th label="Data" k="published_at" />
                      <th className="px-4 py-3 text-center text-xs uppercase tracking-wider font-medium w-28" style={{ color: 'var(--text-muted)' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedVideos.map((video) => {
                      const isThisGenerating = generatingRowId === video.id
                      return (
                        <tr key={video.id}
                          style={{ borderBottom: '1px solid var(--border-soft)', opacity: video.processed ? 0.35 : 1 }}
                          onMouseEnter={(e) => { if (!selectedIds.has(video.id)) (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)' }}
                          onMouseLeave={(e) => { if (!selectedIds.has(video.id)) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedIds.has(video.id)} onChange={() => toggleSelect(video.id)}
                              disabled={video.processed} className="rounded cursor-pointer" style={{ accentColor: 'var(--yellow)' }} />
                          </td>
                          <td className="px-4 py-3 min-w-[260px]">
                            <div className="flex items-center gap-3">
                              <img src={video.thumbnail_url} alt="" className="w-20 h-12 object-cover rounded-lg flex-shrink-0"
                                style={{ border: '1px solid var(--border)' }} />
                              <div className="min-w-0">
                                <p className="font-medium leading-tight line-clamp-2 text-sm" style={{ color: 'var(--text-primary)' }}>{video.title}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{video.channel_name}</p>
                                {video.processed && (
                                  <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: '#0f2a14', color: '#86efac', border: '1px solid #1a3a1e' }}>✓ gerado</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-base tabular-nums ${ratioColor(video.like_view_ratio || 0)}`}>{(video.like_view_ratio || 0).toFixed(1)}%</span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{fmt(video.view_count)}</td>
                          <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>{fmt(video.like_count)}</td>
                          <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>{fmt(video.comment_count)}</td>
                          <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>{fmt(video.subscriber_count || 0)}</td>
                          <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>{formatDuration(video.duration)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            {new Date(video.published_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <a href={`https://youtube.com/watch?v=${video.youtube_id}`} target="_blank" rel="noopener noreferrer"
                                title="Assistir no YouTube"
                                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-sm"
                                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>▶️</a>
                              {!video.processed && (
                                <button
                                  onClick={() => generateSingle(video.id)}
                                  disabled={isGenerating}
                                  title="Gerar carrossel direto"
                                  className="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm transition-all disabled:opacity-40"
                                  style={isThisGenerating
                                    ? { background: 'rgba(255,208,0,0.2)', border: '1px solid rgba(255,208,0,0.4)', color: 'var(--yellow)' }
                                    : { background: 'var(--yellow)', color: '#000', border: '1px solid var(--yellow)' }
                                  }
                                >
                                  {isThisGenerating ? (
                                    <span className="inline-block w-3 h-3 border-2 rounded-full animate-spin"
                                      style={{ borderColor: 'rgba(255,208,0,0.3)', borderTopColor: 'var(--yellow)' }} />
                                  ) : '⚡'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB POSTS ── */}
        {tab === 'posts' && (
          <div>
            {loading ? (
              <div className="text-center py-20">
                <span className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'var(--border)', borderTopColor: 'var(--yellow)' }} />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
                <p className="text-4xl mb-3">📱</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nenhum post ainda. Use ⚡ na tabela para gerar um.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB SETTINGS ── */}
        {tab === 'settings' && (
          <div className="max-w-2xl space-y-6">

            {/* Account info */}
            <div className="rounded-xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Conta</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{userEmail ?? '—'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Autenticado via magic link</p>
                </div>
                <button onClick={logout}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >Sair</button>
              </div>
            </div>

            {/* Instagram connect */}
            <div className="rounded-xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Instagram Graph API</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Conecte sua conta para publicar carrosséis diretamente do ViralPost. Requer acesso ao Meta for Developers.
              </p>

              {igAccount ? (
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#0f2a14', border: '1px solid #1a3a1e' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#86efac' }}>✓ @{igAccount.username || igAccount.ig_user_id} conectado</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4a7a54' }}>IG User ID: {igAccount.ig_user_id}</p>
                  </div>
                  <button onClick={disconnectIg}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: '#2a1111', color: '#f87171', border: '1px solid #3f1919' }}>
                    Desconectar
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      IG User ID
                    </label>
                    <input
                      type="text"
                      value={igUserId}
                      onChange={(e) => setIgUserId(e.target.value)}
                      placeholder="Ex: 17841400008460056"
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--yellow)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Encontre em: Meta Business Suite → Configurações → Instagram → ID da conta
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Access Token (permanente)
                    </label>
                    <input
                      type="password"
                      value={igToken}
                      onChange={(e) => setIgToken(e.target.value)}
                      placeholder="EAAxxxxxx..."
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all font-mono"
                      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--yellow)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Gere em: Meta for Developers → Graph API Explorer → selecione seu app → gere token de longa duração
                    </p>
                  </div>
                  <button
                    onClick={saveIgAccount}
                    disabled={igSaving || !igUserId.trim() || !igToken.trim()}
                    className="px-5 py-2.5 rounded-lg text-sm font-bold disabled:opacity-40 transition-all"
                    style={{ background: 'var(--yellow)', color: '#000' }}
                  >
                    {igSaving ? '⏳ Verificando...' : '🔗 Conectar Instagram'}
                  </button>
                  {igMsg && (
                    <p className="text-sm px-3 py-2 rounded-lg"
                      style={igMsg.startsWith('✅')
                        ? { background: '#0f2a14', color: '#86efac', border: '1px solid #1a3a1e' }
                        : { background: '#2a1111', color: '#f87171', border: '1px solid #3f1919' }
                      }
                    >{igMsg}</p>
                  )}
                </div>
              )}

              <div className="mt-4 p-3 rounded-lg text-xs space-y-1" style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Permissões necessárias no app Meta:</p>
                <p>• instagram_basic · instagram_content_publish · pages_read_engagement</p>
                <p>• O app deve estar em modo Produção (não Development) para publicar</p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
