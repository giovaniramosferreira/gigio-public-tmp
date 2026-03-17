import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserId } from '@/lib/auth'
import { generateCarouselPost } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { videoId, transcript } = await req.json()
  if (!videoId || !transcript) return NextResponse.json({ error: 'videoId e transcript obrigatórios' }, { status: 400 })

  const { data: video } = await supabaseAdmin
    .from('trending_videos').select('youtube_id, title, channel_name, view_count')
    .eq('id', videoId).eq('user_id', userId).single()

  if (!video) return NextResponse.json({ error: 'Vídeo não encontrado' }, { status: 404 })

  const carousel = await generateCarouselPost(
    { youtubeId: video.youtube_id, title: video.title, channelName: video.channel_name, viewCount: video.view_count },
    transcript
  )

  if (!carousel) return NextResponse.json({ error: 'Falha ao gerar carousel com IA' }, { status: 500 })
  return NextResponse.json(carousel)
}
