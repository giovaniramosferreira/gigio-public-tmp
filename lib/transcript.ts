import { YoutubeTranscript } from 'youtube-transcript'

export interface TranscriptResult {
  text: string
  language: string
}

function parseTranscript(items: any[]): string {
  return items
    .map((item) => item.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\[.*?\]/g, '') // remove [Music], [Applause], etc.
    .trim()
    .substring(0, 8000)
}

export async function getTranscript(videoId: string): Promise<TranscriptResult | null> {
  // 1. Try without specifying language — picks whatever is available (including auto-generated)
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    if (transcript?.length > 0) {
      return { text: parseTranscript(transcript), language: 'auto' }
    }
  } catch {}

  // 2. Try common language codes as fallback
  const languages = ['en', 'en-US', 'en-GB', 'pt', 'pt-BR', 'es', 'fr', 'de', 'ja', 'ko']
  for (const lang of languages) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang })
      if (transcript?.length > 0) {
        return { text: parseTranscript(transcript), language: lang }
      }
    } catch {
      continue
    }
  }

  return null
}
