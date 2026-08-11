import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserId } from '@/lib/auth'
import { getTranscript } from '@/lib/transcript'
import { getVideoDescription } from '@/lib/youtube'

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { videoId } = await req.json()
  if (!videoId) return NextResponse.json({ error: 'videoId obrigatório' }, { status: 400 })

  const { data: video } = await supabaseAdmin
    .from('trending_videos').select('youtube_id, title').eq('id', videoId).eq('user_id', userId).single()

  if (!video) return NextResponse.json({ error: 'Vídeo não encontrado' }, { status: 404 })

  // 1. Try transcript (may fail on Vercel IPs blocked by YouTube)
  const transcript = await getTranscript(video.youtube_id)

  if (transcript) {
    await supabaseAdmin.from('trending_videos')
      .update({ transcript: transcript.text, transcript_language: transcript.language }).eq('id', videoId)
    return NextResponse.json({ text: transcript.text, language: transcript.language })
  }

  // 2. Fallback: use video description via YouTube Data API
  const description = await getVideoDescription(video.youtube_id)
  if (description) {
    const fallbackText = `Título: ${video.title}\n\nDescrição:\n${description}`
    await supabaseAdmin.from('trending_videos')
      .update({ transcript: fallbackText, transcript_language: 'description-fallback' }).eq('id', videoId)
    return NextResponse.json({ text: fallbackText, language: 'description-fallback' })
  }

  // 3. Last resort: use only the title
  const titleOnly = `Título do vídeo: ${video.title}`
  await supabaseAdmin.from('trending_videos')
    .update({ transcript: titleOnly, transcript_language: 'title-only' }).eq('id', videoId)
  return NextResponse.json({ text: titleOnly, language: 'title-only' })
}
