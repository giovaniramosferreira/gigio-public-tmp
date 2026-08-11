import { google } from 'googleapis'

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
})

export interface VideoData {
  youtubeId: string
  title: string
  channelName: string
  channelId: string
  thumbnailUrl: string
  viewCount: number
  likeCount: number
  commentCount: number
  duration: string
  publishedAt: string
  likeViewRatio: number   // likes / views * 100
  subscriberCount: number
}

// ── TRENDING (chart mostPopular) ──────────────────────────────────────────────

export async function getTrendingVideos(
  maxResults = 20,
  categoryId?: string
): Promise<VideoData[]> {
  try {
    const params: any = {
      part: ['snippet', 'statistics', 'contentDetails'],
      chart: 'mostPopular',
      regionCode: 'BR',
      maxResults,
      hl: 'pt-BR',
    }
    if (categoryId) params.videoCategoryId = categoryId

    const response = await youtube.videos.list(params)
    const items = response.data.items || []

    // Get subscriber counts for all channels
    const channelIds = [
      ...new Set(items.map((i) => i.snippet?.channelId).filter(Boolean)),
    ] as string[]
    const subMap = await getSubscriberMap(channelIds)

    return items.map((item) => {
      const views = parseInt(item.statistics?.viewCount || '0')
      const likes = parseInt(item.statistics?.likeCount || '0')
      return {
        youtubeId: item.id!,
        title: item.snippet?.title || '',
        channelName: item.snippet?.channelTitle || '',
        channelId: item.snippet?.channelId || '',
        thumbnailUrl:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.default?.url ||
          '',
        viewCount: views,
        likeCount: likes,
        commentCount: parseInt(item.statistics?.commentCount || '0'),
        duration: item.contentDetails?.duration || '',
        publishedAt: item.snippet?.publishedAt || '',
        likeViewRatio: views > 0 ? (likes / views) * 100 : 0,
        subscriberCount: subMap.get(item.snippet?.channelId || '') || 0,
      }
    })
  } catch (error) {
    console.error('Erro ao buscar trending YouTube:', error)
    return []
  }
}

// ── KEYWORD SEARCH (hidden gems) ─────────────────────────────────────────────

export interface SearchOptions {
  maxResultsPerQuery?: number
  minLikeRatio?: number      // % mínimo de likes/views (ex: 5 = 5%)
  minSubscribers?: number
  maxSubscribers?: number
  language?: string          // relevanceLanguage
}

export async function searchVideosByKeywords(
  queries: string[],
  options: SearchOptions = {}
): Promise<VideoData[]> {
  const {
    maxResultsPerQuery = 10,
    minLikeRatio = 0,
    minSubscribers = 0,
    maxSubscribers = Infinity,
    language = 'pt',
  } = options

  const videoIds = new Set<string>()

  // Search each query
  for (const query of queries) {
    try {
      const res = await youtube.search.list({
        part: ['id'],
        q: query,
        type: ['video'],
        maxResults: maxResultsPerQuery,
        relevanceLanguage: language,
        order: 'relevance',
      })
      res.data.items?.forEach((item) => {
        if (item.id?.videoId) videoIds.add(item.id.videoId)
      })
    } catch (error) {
      console.error(`Erro na busca "${query}":`, error)
    }
  }

  // Filter out any empty/undefined IDs
  const validIds = Array.from(videoIds).filter((id): id is string => !!id)
  if (validIds.length === 0) return []

  // Get full stats for found videos
  const statsRes = await youtube.videos.list({
    part: ['snippet', 'statistics', 'contentDetails'],
    id: validIds,
  } as any)
  const items: any[] = statsRes.data.items || []

  // Get subscriber counts
  const channelIds = [
    ...new Set(items.map((i: any) => i.snippet?.channelId).filter(Boolean)),
  ] as string[]
  const subMap = await getSubscriberMap(channelIds)

  // Filtrar: keyword deve aparecer no título do vídeo (não apenas no canal)
  const keywordLower = queries.map((q) => q.toLowerCase())
  const titleMatched = items.filter((item: any) => {
    const title = (item.snippet?.title || '').toLowerCase()
    return keywordLower.some((kw) => title.includes(kw))
  })
  const finalItems = titleMatched.length > 0 ? titleMatched : items

  return finalItems
    .map((item: any) => {
      const views = parseInt(item.statistics?.viewCount || '0')
      const likes = parseInt(item.statistics?.likeCount || '0')
      const channelId = item.snippet?.channelId || ''
      const subscriberCount = subMap.get(channelId) || 0
      const likeViewRatio = views > 0 ? (likes / views) * 100 : 0
      return {
        youtubeId: item.id!,
        title: item.snippet?.title || '',
        channelName: item.snippet?.channelTitle || '',
        channelId,
        thumbnailUrl:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.default?.url ||
          '',
        viewCount: views,
        likeCount: likes,
        commentCount: parseInt(item.statistics?.commentCount || '0'),
        duration: item.contentDetails?.duration || '',
        publishedAt: item.snippet?.publishedAt || '',
        likeViewRatio,
        subscriberCount,
      }
    })
    .filter((v: VideoData) =>
      v.likeViewRatio >= minLikeRatio &&
      v.subscriberCount >= minSubscribers &&
      (maxSubscribers === Infinity || v.subscriberCount <= maxSubscribers)
    )
    .sort((a: VideoData, b: VideoData) => b.likeViewRatio - a.likeViewRatio)
}

// ── VIDEO DESCRIPTION (fallback when transcript unavailable) ─────────────────

export async function getVideoDescription(youtubeId: string): Promise<string | null> {
  try {
    const res = await youtube.videos.list({
      part: ['snippet'],
      id: [youtubeId],
    } as any)
    const item = res.data.items?.[0]
    if (!item) return null
    const desc = item.snippet?.description?.trim()
    return desc && desc.length > 100 ? desc.substring(0, 6000) : null
  } catch {
    return null
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

async function getSubscriberMap(channelIds: string[]): Promise<Map<string, number>> {
  if (channelIds.length === 0) return new Map()
  try {
    const res = await youtube.channels.list({
      part: ['statistics'],
      id: channelIds,
    })
    return new Map(
      res.data.items?.map((c) => [
        c.id!,
        parseInt(c.statistics?.subscriberCount || '0'),
      ]) || []
    )
  } catch {
    return new Map()
  }
}
