import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { getUnsplashPhoto } from '@/lib/unsplash'

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slides } = await req.json()
  if (!slides?.length) return NextResponse.json({ error: 'slides obrigatório' }, { status: 400 })

  const slidesWithImages = await Promise.all(
    slides.map(async (slide: any) => {
      if (!slide.imageQuery) return slide
      const imageUrl = await getUnsplashPhoto(slide.imageQuery)
      return { ...slide, imageUrl: imageUrl || undefined }
    })
  )

  return NextResponse.json({ slides: slidesWithImages })
}
