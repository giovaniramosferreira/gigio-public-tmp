import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getTrendingVideos } from '@/lib/youtube'
import { getTranscript } from '@/lib/transcript'
import { generateCarouselPost } from '@/lib/claude'

const MAX_VIDEOS_PER_RUN = 3

export async function POST(req: NextRequest) {
  // Autenticação do cron
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Criar registro de execução
  const { data: cronRun } = await supabaseAdmin
    .from('cron_runs')
    .insert({ status: 'running' })
    .select()
    .single()

  const runId = cronRun?.id
  const errors: any[] = []
  let videosFound = 0
  let videosProcessed = 0
  let postsGenerated = 0

  // Nicho opcional no body
  let nicheId: string | null = null
  let categoryId: string | undefined = undefined
  try {
    const body = await req.json()
    nicheId = body?.nicheId || null
  } catch {}

  if (nicheId) {
    const { data: niche } = await supabaseAdmin
      .from('niches')
      .select('category_id')
      .eq('id', nicheId)
      .single()
    categoryId = niche?.category_id || undefined
  }

  try {
    // 1. Buscar trending no YouTube BR
    const trending = await getTrendingVideos(20, categoryId)
    videosFound = trending.length
    console.log(`[CRON] ${videosFound} vídeos encontrados`)

    // 2. Filtrar os que já existem no banco
    const newVideos = []
    for (const video of trending) {
      const { data: existing } = await supabaseAdmin
        .from('trending_videos')
        .select('id')
        .eq('youtube_id', video.youtubeId)
        .single()

      if (!existing) newVideos.push(video)
    }

    console.log(`[CRON] ${newVideos.length} vídeos novos para processar`)

    // 3. Processar no máximo MAX_VIDEOS_PER_RUN
    const toProcess = newVideos.slice(0, MAX_VIDEOS_PER_RUN)

    for (const video of toProcess) {
      try {
        // Salvar vídeo no banco
        const { data: savedVideo } = await supabaseAdmin
          .from('trending_videos')
          .insert({
            youtube_id: video.youtubeId,
            title: video.title,
            channel_name: video.channelName,
            channel_id: video.channelId,
            thumbnail_url: video.thumbnailUrl,
            view_count: video.viewCount,
            like_count: video.likeCount,
            comment_count: video.commentCount,
            duration: video.duration,
            published_at: video.publishedAt,
            niche_id: nicheId,
          })
          .select()
          .single()

        if (!savedVideo) continue

        // Buscar transcrição
        const transcript = await getTranscript(video.youtubeId)

        if (!transcript) {
          console.log(`[CRON] Sem transcrição para: ${video.title}`)
          errors.push({ video: video.title, error: 'Sem transcrição disponível' })
          continue
        }

        // Atualizar transcrição no banco
        await supabaseAdmin
          .from('trending_videos')
          .update({
            transcript: transcript.text,
            transcript_language: transcript.language,
          })
          .eq('id', savedVideo.id)

        // Gerar carousel com Claude
        const carousel = await generateCarouselPost(video, transcript.text)

        if (!carousel) {
          errors.push({ video: video.title, error: 'Falha ao gerar carousel' })
          continue
        }

        // Salvar carousel no banco
        await supabaseAdmin.from('carousel_posts').insert({
          video_id: savedVideo.id,
          slides: carousel.slides,
          caption: carousel.caption,
          hashtags: carousel.hashtags,
          status: 'draft',
        })

        // Marcar vídeo como processado
        await supabaseAdmin
          .from('trending_videos')
          .update({ processed: true })
          .eq('id', savedVideo.id)

        videosProcessed++
        postsGenerated++
        console.log(`[CRON] Post gerado para: ${video.title}`)
      } catch (err: any) {
        console.error(`[CRON] Erro no vídeo ${video.title}:`, err)
        errors.push({ video: video.title, error: err.message })
      }
    }

    // Finalizar execução com sucesso
    await supabaseAdmin
      .from('cron_runs')
      .update({
        finished_at: new Date().toISOString(),
        videos_found: videosFound,
        videos_processed: videosProcessed,
        posts_generated: postsGenerated,
        errors: errors.length > 0 ? errors : null,
        status: 'success',
      })
      .eq('id', runId)

    return NextResponse.json({
      success: true,
      videosFound,
      videosProcessed,
      postsGenerated,
      errors,
    })
  } catch (err: any) {
    await supabaseAdmin
      .from('cron_runs')
      .update({ status: 'failed', errors: [{ error: err.message }], finished_at: new Date().toISOString() })
      .eq('id', runId)

    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// Vercel Cron chama via GET
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Redireciona para o POST internamente
  const baseUrl = req.nextUrl.origin
  const response = await fetch(`${baseUrl}/api/cron/run`, {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  })

  const data = await response.json()
  return NextResponse.json(data)
}
