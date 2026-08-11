import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserId } from '@/lib/auth'
import { getTrendingVideos, searchVideosByKeywords } from '@/lib/youtube'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    mode = 'trending',
    nicheId = null,
    keywords = [],
    maxResultsPerQuery = 25,
    minLikeRatio = 0,
    minSubscribers = 0,
    maxSubscribers = 0,
    language = 'pt',
  } = body

  let videos: any[] = []

  if (mode === 'search') {
    let searchQueries: string[] = keywords
    if (!searchQueries.length && nicheId) {
      const { data: niche } = await supabaseAdmin.from('niches').select('keywords').eq('id', nicheId).single()
      searchQueries = niche?.keywords || []
    }
    if (!searchQueries.length) return NextResponse.json({ error: 'Nenhuma keyword fornecida' }, { status: 400 })
    videos = await searchVideosByKeywords(searchQueries, {
      maxResultsPerQuery, minLikeRatio, minSubscribers,
      maxSubscribers: maxSubscribers > 0 ? maxSubscribers : Infinity, language,
    })
  } else {
    let categoryId: string | undefined
    if (nicheId) {
      const { data: niche } = await supabaseAdmin.from('niches').select('category_id').eq('id', nicheId).single()
      categoryId = niche?.category_id || undefined
    }
    videos = await getTrendingVideos(20, categoryId)
  }

  const result = []
  for (const video of videos) {
    const { data: existing } = await supabaseAdmin
      .from('trending_videos')
      .select('id, youtube_id, title, channel_name, thumbnail_url, view_count, like_count, comment_count, duration, published_at, processed, subscriber_count, like_view_ratio')
      .eq('youtube_id', video.youtubeId)
      .eq('user_id', userId)
      .single()

    if (existing) { result.push(existing); continue }

    const { data: saved } = await supabaseAdmin
      .from('trending_videos')
      .insert({
        youtube_id: video.youtubeId, title: video.title, channel_name: video.channelName,
        channel_id: video.channelId, thumbnail_url: video.thumbnailUrl,
        view_count: video.viewCount, like_count: video.likeCount,
        comment_count: video.commentCount, duration: video.duration,
        published_at: video.publishedAt, niche_id: nicheId,
        subscriber_count: video.subscriberCount,
        like_view_ratio: parseFloat(video.likeViewRatio.toFixed(2)),
        search_mode: mode, user_id: userId,
      })
      .select('id, youtube_id, title, channel_name, thumbnail_url, view_count, like_count, comment_count, duration, published_at, processed, subscriber_count, like_view_ratio')
      .single()

    if (saved) result.push(saved)
  }

  return NextResponse.json(result)
}
