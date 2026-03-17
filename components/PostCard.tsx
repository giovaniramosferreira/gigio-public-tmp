'use client'
import { useState } from 'react'
import CarouselPreview from './CarouselPreview'

interface Post {
  id: string
  slides: any[]
  caption: string
  hashtags: string[]
  hashtag_groups?: { small?: string[]; medium?: string[]; large?: string[] }
  first_comment?: string
  style?: string
  status: string
  created_at: string
  trending_videos: {
    youtube_id: string
    title: string
    channel_name: string
    thumbnail_url: string
    view_count: number
  }
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return String(n)
}

export default function PostCard({ post }: { post: Post }) {
  const [open, setOpen] = useState(false)
  const video = post.trending_videos

  const statusStyle: Record<string, { bg: string; color: string; border: string }> = {
    draft:    { bg: '#2a1f00', color: '#fbbf24', border: '#3a2a00' },
    approved: { bg: '#0f2a14', color: '#86efac', border: '#1a3a1e' },
    posted:   { bg: '#0d1f2a', color: '#60c8f5', border: '#152a3a' },
  }
  const s = statusStyle[post.status] || { bg: '#1f1f1f', color: '#888', border: '#2a2a2a' }

  return (
    <>
      <div
        className="rounded-xl overflow-hidden transition-all cursor-pointer group"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        onClick={() => setOpen(true)}
      >
        <div className="relative">
          <img
            src={video?.thumbnail_url}
            alt={video?.title}
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-2xl">👁</span>
          </div>
          <div className="absolute top-2 left-2">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
            >
              {post.status}
            </span>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>
            {video?.title}
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{video?.channel_name}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {fmt(video?.view_count || 0)} views
          </p>
          <div className="mt-3 py-2 rounded-lg text-xs font-bold text-center" style={{ background: 'var(--yellow-glow)', color: 'var(--yellow)', border: '1px solid rgba(255,208,0,0.15)' }}>
            Ver Carrossel
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            className="rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-6"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Preview do Carrossel</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-lg"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-raised)' }}
              >
                ✕
              </button>
            </div>
            <CarouselPreview
              slides={post.slides}
              caption={post.caption}
              hashtags={post.hashtags}
              hashtagGroups={post.hashtag_groups}
              firstComment={post.first_comment}
              styleId={post.style}
            />
            <a
              href={`https://youtube.com/watch?v=${video?.youtube_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 py-2 rounded-xl text-sm transition-colors"
              style={{ border: '1px solid #3f1919', color: '#f87171' }}
            >
              ▶️ Assistir no YouTube
            </a>
          </div>
        </div>
      )}
    </>
  )
}
