export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserId } from '@/lib/auth'
import { google } from 'googleapis'

const youtube = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_API_KEY })

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim())
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
    if (u.hostname.includes('youtube.com')) {
      if (u.searchParams.get('v')) return u.searchParams.get('v')
      const m = u.pathname.match(/\/(shorts|embed|v)\/([^/?]+)/)
      if (m) return m[2]
    }
  } catch {}
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim()
  return null
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 })

  const videoId = extractVideoId(url)
  if (!videoId) return NextResponse.json({ error: 'URL do YouTube inválida' }, { status: 400 })

  const { data: existing } = await supabaseAdmin
    .from('trending_videos')
    .select('id, youtube_id, title, channel_name, thumbnail_url, view_count, like_count, comment_count, duration, published_at, processed, subscriber_count, like_view_ratio')
    .eq('youtube_id', videoId).eq('user_id', userId).single()

  if (existing) return NextResponse.json(existing)

  const res = await youtube.videos.list({ part: ['snippet', 'statistics', 'contentDetails'], id: [videoId] } as any)
  const item = res.data.items?.[0]
  if (!item) return NextResponse.json({ error: 'Vídeo não encontrado no YouTube' }, { status: 404 })

  const channelId = item.snippet?.channelId || ''
  let subscriberCount = 0
  if (channelId) {
    try {
      const chanRes = await youtube.channels.list({ part: ['statistics'], id: [channelId] })
      subscriberCount = parseInt(chanRes.data.items?.[0]?.statistics?.subscriberCount || '0')
    } catch {}
  }

  const views = parseInt(item.statistics?.viewCount || '0')
  const likes = parseInt(item.statistics?.likeCount || '0')

  const { data: saved } = await supabaseAdmin
    .from('trending_videos')
    .insert({
      youtube_id: videoId, title: item.snippet?.title || '',
      channel_name: item.snippet?.channelTitle || '', channel_id: channelId,
      thumbnail_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
      view_count: views, like_count: likes,
      comment_count: parseInt(item.statistics?.commentCount || '0'),
      duration: item.contentDetails?.duration || '',
      published_at: item.snippet?.publishedAt || '',
      subscriber_count: subscriberCount,
      like_view_ratio: parseFloat((views > 0 ? (likes / views) * 100 : 0).toFixed(2)),
      search_mode: 'url', user_id: userId,
    })
    .select('id, youtube_id, title, channel_name, thumbnail_url, view_count, like_count, comment_count, duration, published_at, processed, subscriber_count, like_view_ratio')
    .single()

  if (!saved) return NextResponse.json({ error: 'Erro ao salvar vídeo' }, { status: 500 })
  return NextResponse.json(saved)
}
