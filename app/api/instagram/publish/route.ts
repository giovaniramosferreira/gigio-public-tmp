import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserId } from '@/lib/auth'

const IG_API = 'https://graph.facebook.com/v19.0'

interface IgMediaResult {
  id?: string
  error?: { message: string; code?: number }
}

async function createImageContainer(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  isCarouselItem = false,
): Promise<string> {
  const params = new URLSearchParams({
    image_url: imageUrl,
    access_token: accessToken,
    ...(isCarouselItem ? { is_carousel_item: 'true' } : {}),
  })
  const res = await fetch(`${IG_API}/${igUserId}/media`, {
    method: 'POST',
    body: params,
  })
  const json = await res.json() as IgMediaResult
  if (!json.id) throw new Error(json.error?.message ?? 'Falha ao criar container de imagem')
  return json.id
}

async function waitForContainer(
  containerId: string,
  accessToken: string,
  maxWait = 30000,
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    const res = await fetch(
      `${IG_API}/${containerId}?fields=status_code&access_token=${accessToken}`
    )
    const json = await res.json() as { status_code?: string }
    if (json.status_code === 'FINISHED') return
    if (json.status_code === 'ERROR') throw new Error('Falha no processamento do container de imagem')
    await new Promise((r) => setTimeout(r, 2000))
  }
  throw new Error('Timeout aguardando processamento da imagem')
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId, imageUrls, caption } = await req.json() as {
    postId: string
    imageUrls: string[]
    caption: string
  }

  if (!postId || !imageUrls?.length || !caption) {
    return NextResponse.json({ error: 'postId, imageUrls e caption são obrigatórios' }, { status: 400 })
  }

  // Get stored Instagram credentials
  const { data: igAccount } = await supabaseAdmin
    .from('instagram_accounts')
    .select('ig_user_id, access_token')
    .eq('user_id', userId)
    .single()

  if (!igAccount) {
    return NextResponse.json({ error: 'Conta do Instagram não conectada. Vá em Configurações para conectar.' }, { status: 400 })
  }

  const { ig_user_id: igUserId, access_token: accessToken } = igAccount

  try {
    let mediaId: string

    if (imageUrls.length === 1) {
      // Single image post
      mediaId = await createImageContainer(igUserId, accessToken, imageUrls[0])
      await waitForContainer(mediaId, accessToken)
    } else {
      // Carousel post — create containers for each image
      const itemIds: string[] = []
      for (const url of imageUrls) {
        const itemId = await createImageContainer(igUserId, accessToken, url, true)
        await waitForContainer(itemId, accessToken)
        itemIds.push(itemId)
      }

      // Create carousel container
      const carouselParams = new URLSearchParams({
        media_type: 'CAROUSEL',
        children: itemIds.join(','),
        caption,
        access_token: accessToken,
      })
      const carouselRes = await fetch(`${IG_API}/${igUserId}/media`, {
        method: 'POST',
        body: carouselParams,
      })
      const carouselJson = await carouselRes.json() as IgMediaResult
      if (!carouselJson.id) throw new Error(carouselJson.error?.message ?? 'Falha ao criar carrossel')
      mediaId = carouselJson.id
      await waitForContainer(mediaId, accessToken)
    }

    // Publish the container
    const publishParams = new URLSearchParams({
      creation_id: mediaId,
      access_token: accessToken,
    })
    const publishRes = await fetch(`${IG_API}/${igUserId}/media_publish`, {
      method: 'POST',
      body: publishParams,
    })
    const publishJson = await publishRes.json() as IgMediaResult
    if (!publishJson.id) throw new Error(publishJson.error?.message ?? 'Falha ao publicar')

    // Mark post as published in our DB
    await supabaseAdmin
      .from('carousel_posts')
      .update({ status: 'posted' })
      .eq('id', postId)
      .eq('user_id', userId)

    return NextResponse.json({ ok: true, igMediaId: publishJson.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido ao publicar'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
