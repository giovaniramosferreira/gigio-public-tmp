export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getTranscript } from '@/lib/transcript'
import { generateCarouselPost } from '@/lib/claude'
import { getUnsplashPhoto } from '@/lib/unsplash'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { videoIds } = await req.json()
  if (!videoIds?.length) {
    return NextResponse.json({ error: 'Nenhum vídeo selecionado' }, { status: 400 })
  }

  let success = 0
  const errors: any[] = []
  const posts: any[] = []

  for (const videoId of videoIds) {
    const { data: video } = await supabaseAdmin
      .from('trending_videos')
      .select('*')
      .eq('id', videoId)
      .single()

    if (!video) continue

    try {
      const transcript = await getTranscript(video.youtube_id)

      if (!transcript) {
        errors.push({ video: video.title, error: 'Sem transcrição disponível' })
        continue
      }

      await supabaseAdmin
        .from('trending_videos')
        .update({ transcript: transcript.text, transcript_language: transcript.language })
        .eq('id', videoId)

      const carousel = await generateCarouselPost(
        {
          youtubeId: video.youtube_id,
          title: video.title,
          channelName: video.channel_name,
          viewCount: video.view_count,
        },
        transcript.text
      )

      if (!carousel) {
        errors.push({ video: video.title, error: 'Falha ao gerar carousel' })
        continue
      }

      const slidesWithImages = await Promise.all(
        carousel.slides.map(async (slide) => {
          if (!slide.imageQuery) return slide
          const imageUrl = await getUnsplashPhoto(slide.imageQuery)
          return { ...slide, imageUrl: imageUrl || undefined }
        })
      )

      const { data: saved } = await supabaseAdmin
        .from('carousel_posts')
        .insert({
          video_id: videoId,
          slides: slidesWithImages,
          caption: carousel.caption,
          hashtags: carousel.hashtags,
          first_comment: carousel.firstComment || null,
          hashtag_groups: carousel.hashtagGroups || null,
          status: 'draft',
        })
        .select('*, trending_videos(youtube_id, title, channel_name, thumbnail_url, view_count)')
        .single()

      await supabaseAdmin
        .from('trending_videos')
        .update({ processed: true })
        .eq('id', videoId)

      if (saved) posts.push(saved)
      success++
    } catch (err: any) {
      console.error(`[GENERATE] Erro: ${video.title}`, err)
      errors.push({ video: video.title, error: err.message })
    }
  }

  return NextResponse.json({ success, errors, total: videoIds.length, posts })
}
