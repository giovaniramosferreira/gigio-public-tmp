'use client'
import { useRef, useState } from 'react'
import { getStyle, STYLE_LIST, type StyleId } from '@/lib/styles'

interface Slide {
  order: number
  type: 'cover' | 'content' | 'cta'
  title: string
  content: string
  emoji: string
  imageQuery?: string
  imageUrl?: string
  altText?: string
}

interface HashtagGroups {
  small?: string[]
  medium?: string[]
  large?: string[]
}

interface CarouselPreviewProps {
  slides: Slide[]
  caption: string
  hashtags: string[]
  hashtagGroups?: HashtagGroups
  firstComment?: string
  styleId?: string | null
}

function CopyButton({ text, label, small = false }: { text: string; label: string; small?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className={`rounded-lg font-semibold transition-all ${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
      style={
        copied
          ? { background: '#0f2a14', color: '#86efac', border: '1px solid #1a3a1e' }
          : { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
      }
    >
      {copied ? '✓ Copiado!' : label}
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
        {title}
      </p>
      {children}
    </div>
  )
}

export default function CarouselPreview({ slides, caption, hashtags, hashtagGroups, firstComment, styleId }: CarouselPreviewProps) {
  const [current, setCurrent] = useState(0)
  const [downloading, setDownloading] = useState(false)

  const style = getStyle(styleId)
  const slide = slides[current]

  function getOverlay(s: Slide) {
    if (s.type === 'cover')   return style.coverOverlay
    if (s.type === 'cta')     return style.ctaOverlay
    return style.contentOverlay
  }

  function getFallback(s: Slide) {
    if (s.type === 'cover')   return style.coverFallback
    if (s.type === 'cta')     return style.ctaFallback
    return style.contentFallback
  }

  async function downloadAllSlides() {
    setDownloading(true)
    try {
      const [{ default: html2canvas }, { default: JSZip }] = await Promise.all([
        import('html2canvas'),
        import('jszip'),
      ])

      const zip = new JSZip()
      const folder = zip.folder('carrossel')!

      for (let i = 0; i < slides.length; i++) {
        const s = slides[i]
        const wrapper = document.createElement('div')
        wrapper.style.cssText = `
          position:fixed; left:-9999px; top:-9999px;
          width:1080px; height:1080px; overflow:hidden;
        `

        const bg = document.createElement('div')
        bg.style.cssText = `position:absolute; inset:0; ${s.imageUrl
          ? `background:url("${s.imageUrl}") center/cover no-repeat;`
          : `background:${getFallback(s)};`}`

        const ov = document.createElement('div')
        ov.style.cssText = `position:absolute; inset:0; background:${getOverlay(s)};`

        const content = document.createElement('div')
        content.style.cssText = `
          position:absolute; inset:0; z-index:10;
          display:flex; flex-direction:column; justify-content:center; align-items:center;
          text-align:center; padding:80px; color:white;
        `
        content.innerHTML = `
          <div style="font-size:120px; margin-bottom:40px; line-height:1;">${s.emoji}</div>
          <h2 style="font-size:72px; font-weight:800; line-height:1.15; margin-bottom:32px; text-shadow:0 2px 12px rgba(0,0,0,0.6); font-family:sans-serif; color:${style.titleColor};">${s.title}</h2>
          <p style="font-size:38px; line-height:1.6; text-shadow:0 1px 6px rgba(0,0,0,0.5); font-family:sans-serif; color:${style.contentColor};">${s.content}</p>
        `

        const counter = document.createElement('div')
        counter.style.cssText = `
          position:absolute; bottom:32px; right:40px; z-index:10;
          font-size:28px; color:rgba(255,255,255,0.6); font-family:sans-serif; font-weight:600;
        `
        counter.textContent = `${i + 1} / ${slides.length}`

        wrapper.appendChild(bg)
        wrapper.appendChild(ov)
        wrapper.appendChild(content)
        wrapper.appendChild(counter)
        document.body.appendChild(wrapper)

        try {
          const canvas = await html2canvas(wrapper, {
            useCORS: true, allowTaint: false, scale: 1, width: 1080, height: 1080, logging: false,
          })
          const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
          folder.file(`slide_${String(i + 1).padStart(2, '0')}.png`, blob)
        } finally {
          document.body.removeChild(wrapper)
        }
      }

      // Include a text file with caption + first comment + alt texts
      const seoTxt = [
        '=== LEGENDA ===',
        caption,
        '',
        '=== PRIMEIRO COMENTÁRIO (hashtags) ===',
        firstComment || hashtags.map(h => `#${h}`).join(' '),
        '',
        '=== ALT TEXT POR SLIDE ===',
        ...slides.map((s, i) => `Slide ${i + 1}: ${s.altText || s.title}`),
      ].join('\n')
      folder.file('_conteudo_instagram.txt', seoTxt)

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'carrossel_instagram.zip'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erro ao baixar slides:', err)
      alert('Erro ao gerar o download. Tente novamente.')
    }
    setDownloading(false)
  }

  // Build caption preview: first line as hook, rest collapsed
  const captionLines = caption.split('\n')
  const hook = captionLines[0]
  const body = captionLines.slice(1).join('\n').trim()

  return (
    <div className="flex flex-col gap-4">

      {/* ── Style badge ── */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: style.accentColor }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{style.name}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>— {style.description}</span>
      </div>

      {/* ── Slide preview ── */}
      <div className="relative rounded-2xl aspect-square overflow-hidden shadow-2xl">
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl} alt={slide.altText || slide.title}
            className="absolute inset-0 w-full h-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: getFallback(slide) }} />
        )}
        <div className="absolute inset-0" style={{ background: getOverlay(slide) }} />

        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center text-white p-8">
          <span className="text-5xl mb-4 drop-shadow-lg">{slide.emoji}</span>
          <h2 className="text-2xl font-bold mb-3 leading-tight drop-shadow-lg">{slide.title}</h2>
          <p className="text-sm opacity-90 leading-relaxed drop-shadow">{slide.content}</p>
        </div>

        <div className="absolute bottom-3 right-4 z-10 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.7)' }}>
          {current + 1} / {slides.length}
        </div>

        {slide.imageUrl && (
          <div className="absolute bottom-3 left-4 z-10 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            📷 Unsplash
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className="flex gap-2 justify-center items-center">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-30 transition-colors"
          style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          ←
        </button>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="h-2 rounded-full transition-all duration-200"
            style={{ width: i === current ? '24px' : '8px', background: i === current ? 'var(--yellow)' : 'var(--border)' }}
          />
        ))}
        <button
          onClick={() => setCurrent((c) => Math.min(slides.length - 1, c + 1))}
          disabled={current === slides.length - 1}
          className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-30 transition-colors"
          style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          →
        </button>
      </div>

      {/* ── Alt text do slide atual ── */}
      {slide.altText && (
        <div className="rounded-lg px-3 py-2 flex items-start gap-2"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
          <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>♿</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
              Alt text — slide {current + 1}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{slide.altText}</p>
          </div>
          <CopyButton text={slide.altText} label="Copiar" small />
        </div>
      )}

      {/* ── Legenda ── */}
      <Section title="📝 Legenda (com hook SEO)">
        {/* Hook highlight */}
        <div className="rounded-lg px-3 py-2 mb-2" style={{ background: 'rgba(255,208,0,0.07)', border: '1px solid rgba(255,208,0,0.15)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--yellow)' }}>
            Hook — aparece antes do "ver mais"
          </p>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{hook}</p>
        </div>
        {body && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3" style={{ color: 'var(--text-secondary)' }}>
            {body}
          </p>
        )}
        <CopyButton text={caption} label="Copiar legenda completa" />
      </Section>

      {/* ── Primeiro comentário ── */}
      <Section title="💬 Primeiro comentário (hashtags)">
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          Cole como primeiro comentário logo após publicar — mantém a legenda limpa e ainda ranqueia.
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--yellow)', wordBreak: 'break-all' }}>
          {firstComment || hashtags.map(h => `#${h}`).join(' ')}
        </p>
        <CopyButton text={firstComment || hashtags.map(h => `#${h}`).join(' ')} label="Copiar hashtags" />
      </Section>

      {/* ── Hashtag groups ── */}
      {hashtagGroups && (
        <Section title="🏷 Mix de hashtags (estratégia SEO)">
          <div className="space-y-3">
            {[
              { key: 'small',  label: 'Nicho — <100K posts', sublabel: 'Mais fácil de rankear no topo', color: '#86efac', bg: '#0f2a14', border: '#1a3a1e' },
              { key: 'medium', label: 'Médias — 100K–1M',    sublabel: 'Alcance intermediário',        color: 'var(--yellow)', bg: 'rgba(255,208,0,0.07)', border: 'rgba(255,208,0,0.15)' },
              { key: 'large',  label: 'Amplas — >1M posts',  sublabel: 'Visibilidade máxima',          color: '#60c8f5', bg: '#0d1f2a', border: '#152a3a' },
            ].map(({ key, label, sublabel, color, bg, border }) => {
              const tags = hashtagGroups[key as keyof HashtagGroups] || []
              if (!tags.length) return null
              return (
                <div key={key}>
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sublabel}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: bg, color, border: `1px solid ${border}` }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* ── Alt texts de todos os slides ── */}
      <Section title="♿ Alt texts — todos os slides">
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Adicione no Instagram ao publicar: Avançado → Acessibilidade → Alt text por foto.
        </p>
        <div className="space-y-2">
          {slides.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs font-bold w-12 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Slide {i + 1}
              </span>
              <p className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>
                {s.altText || s.title}
              </p>
              <CopyButton text={s.altText || s.title} label="↗" small />
            </div>
          ))}
        </div>
      </Section>

      {/* ── Download ── */}
      <button
        onClick={downloadAllSlides}
        disabled={downloading}
        className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: 'var(--bg-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
      >
        {downloading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--yellow)' }} />
            Gerando imagens...
          </>
        ) : (
          <>⬇ Baixar {slides.length} slides + conteúdo (ZIP)</>
        )}
      </button>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        ZIP inclui os slides PNG + arquivo de texto com legenda, hashtags e alt texts
      </p>
    </div>
  )
}
