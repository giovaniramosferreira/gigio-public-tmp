import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getTranscript } from '@/lib/transcript'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { videoId } = await req.json()
  if (!videoId) return NextResponse.json({ error: 'videoId obrigatório' }, { status: 400 })

  const { data: video } = await supabaseAdmin
    .from('trending_videos')
    .select('youtube_id, title')
    .eq('id', videoId)
    .single()

  if (!video) return NextResponse.json({ error: 'Vídeo não encontrado' }, { status: 404 })

  const transcript = await getTranscript(video.youtube_id)
  if (!transcript) {
    return NextResponse.json({ error: 'Transcrição não disponível para este vídeo' }, { status: 422 })
  }

  await supabaseAdmin
    .from('trending_videos')
    .update({ transcript: transcript.text, transcript_language: transcript.language })
    .eq('id', videoId)

  return NextResponse.json({ text: transcript.text, language: transcript.language })
}
