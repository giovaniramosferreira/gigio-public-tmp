import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserId } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ totalPosts: 0, totalVideos: 0, postsToday: 0 })

  const today = new Date().toISOString().split('T')[0]

  const [posts, videos, todayPosts] = await Promise.all([
    supabaseAdmin.from('carousel_posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabaseAdmin.from('trending_videos').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabaseAdmin.from('carousel_posts').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', today),
  ])

  return NextResponse.json({
    totalPosts:  posts.count     ?? 0,
    totalVideos: videos.count    ?? 0,
    postsToday:  todayPosts.count ?? 0,
  })
}
