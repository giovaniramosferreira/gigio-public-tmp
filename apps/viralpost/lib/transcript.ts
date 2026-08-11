import { YoutubeTranscript } from 'youtube-transcript'

export interface TranscriptResult {
  text: string
  language: string
}

function clean(text: string): string {
  return text
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 8000)
}

// ── 1. Supadata API (works on Vercel — not scraping) ─────────────────────────
async function trySupadata(videoId: string): Promise<TranscriptResult | null> {
  const apiKey = process.env.SUPADATA_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`,
      { headers: { 'x-api-key': apiKey }, signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const text = typeof data.content === 'string' ? data.content : data.transcript ?? ''
    if (text.length < 50) return null
    return { text: clean(text), language: data.lang ?? 'auto' }
  } catch {
    return null
  }
}

// ── 2. youtube-transcript package (works locally, often blocked on Vercel) ───
async function tryYoutubeTranscript(videoId: string): Promise<TranscriptResult | null> {
  // Try without lang first (auto-generated captions)
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId)
    if (items?.length > 0) {
      return { text: clean(items.map((i) => i.text).join(' ')), language: 'auto' }
    }
  } catch {}

  const languages = ['en', 'en-US', 'en-GB', 'pt', 'pt-BR', 'es', 'fr', 'de', 'ja', 'ko']
  for (const lang of languages) {
    try {
      const items = await YoutubeTranscript.fetchTranscript(videoId, { lang })
      if (items?.length > 0) {
        return { text: clean(items.map((i) => i.text).join(' ')), language: lang }
      }
    } catch {
      continue
    }
  }
  return null
}

// ── Main ─────────────────────────────────────────────────────────────────────
export async function getTranscript(videoId: string): Promise<TranscriptResult | null> {
  return (await trySupadata(videoId)) ?? (await tryYoutubeTranscript(videoId))
}
