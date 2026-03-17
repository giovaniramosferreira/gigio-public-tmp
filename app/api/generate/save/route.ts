import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { videoId, slides, caption, hashtags, hashtagGroups, firstComment } = await req.json()
  if (!videoId || !slides || !caption) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const { data: post, error } = await supabaseAdmin
    .from('carousel_posts')
    .insert({
      video_id: videoId,
      slides,
      caption,
      hashtags: hashtags || [],
      first_comment: firstComment || null,
      hashtag_groups: hashtagGroups || null,
      status: 'draft',
    })
    .select('*, trending_videos(youtube_id, title, channel_name, thumbnail_url, view_count)')
    .single()

  if (error || !post) {
    return NextResponse.json({ error: 'Erro ao salvar no banco' }, { status: 500 })
  }

  await supabaseAdmin
    .from('trending_videos')
    .update({ processed: true })
    .eq('id', videoId)

  return NextResponse.json({ post })
}
