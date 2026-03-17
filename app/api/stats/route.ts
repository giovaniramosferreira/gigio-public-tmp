import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const [posts, videos, todayPosts] = await Promise.all([
    supabaseAdmin.from('carousel_posts').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('trending_videos').select('id', { count: 'exact', head: true }),
    supabaseAdmin
      .from('carousel_posts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().split('T')[0]),
  ])

  return NextResponse.json({
    totalPosts: posts.count || 0,
    totalVideos: videos.count || 0,
    postsToday: todayPosts.count || 0,
  })
}
