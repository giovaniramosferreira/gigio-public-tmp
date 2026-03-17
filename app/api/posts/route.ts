import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('carousel_posts')
    .select(`
      *,
      trending_videos (
        youtube_id,
        title,
        channel_name,
        thumbnail_url,
        view_count
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
