async function tryFetch(query: string, accessKey: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const photos: any[] = data.results || []
    if (!photos.length) return null
    // Pick randomly from top 5 to add variety across slides
    const pick = photos[Math.floor(Math.random() * Math.min(5, photos.length))]
    return pick?.urls?.regular || null
  } catch {
    return null
  }
}

export async function getUnsplashPhoto(query: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) return null

  // Try progressively simpler queries as fallback
  const words = query.trim().split(/\s+/)
  const candidates = [
    query,
    words.slice(0, 3).join(' '),   // first 3 words
    words.slice(0, 2).join(' '),   // first 2 words
    words[0],                       // first word only
  ].filter((q, i, arr) => q && arr.indexOf(q) === i) // deduplicate

  for (const q of candidates) {
    const url = await tryFetch(q, accessKey)
    if (url) return url
  }
  return null
}
