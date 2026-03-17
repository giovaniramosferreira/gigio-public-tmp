import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getTrendingVideos, searchVideosByKeywords } from '@/lib/youtube'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    mode = 'trending',
    nicheId = null,
    keywords = [],
    maxResultsPerQuery = 25,
    minLikeRatio = 0,
    minSubscribers = 0,
    maxSubscribers = 0,      // 0 = sem limite
    language = 'pt',
  } = body

  let videos: any[] = []

  if (mode === 'search') {
    // Modo busca por keywords
    let searchQueries: string[] = keywords

    // Se não passaram keywords mas passaram nicheId, usa as keywords do nicho
    if (!searchQueries.length && nicheId) {
      const { data: niche } = await supabaseAdmin
        .from('niches')
        .select('keywords')
        .eq('id', nicheId)
        .single()
      searchQueries = niche?.keywords || []
    }

    if (!searchQueries.length) {
      return NextResponse.json({ error: 'Nenhuma keyword fornecida' }, { status: 400 })
    }

    videos = await searchVideosByKeywords(searchQueries, {
      maxResultsPerQuery,
      minLikeRatio,
      minSubscribers,
      maxSubscribers: maxSubscribers > 0 ? maxSubscribers : Infinity,
      language,
    })
  } else {
    // Modo trending
    let categoryId: string | undefined
    if (nicheId) {
      const { data: niche } = await supabaseAdmin
        .from('niches')
        .select('category_id')
        .eq('id', nicheId)
        .single()
      categoryId = niche?.category_id || undefined
    }
    videos = await getTrendingVideos(20, categoryId)
  }

  // Save to DB (upsert — skip already existing)
  const result = []
  for (const video of videos) {
    const { data: existing } = await supabaseAdmin
      .from('trending_videos')
      .select('id, youtube_id, title, channel_name, thumbnail_url, view_count, like_count, comment_count, duration, published_at, processed, subscriber_count, like_view_ratio')
      .eq('youtube_id', video.youtubeId)
      .single()

    if (existing) {
      result.push(existing)
      continue
    }

    const { data: saved } = await supabaseAdmin
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
        subscriber_count: video.subscriberCount,
        like_view_ratio: parseFloat(video.likeViewRatio.toFixed(2)),
        search_mode: mode,
      })
      .select('id, youtube_id, title, channel_name, thumbnail_url, view_count, like_count, comment_count, duration, published_at, processed, subscriber_count, like_view_ratio')
      .single()

    if (saved) result.push(saved)
  }

  return NextResponse.json(result)
}
