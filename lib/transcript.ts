import { YoutubeTranscript } from 'youtube-transcript'

export interface TranscriptResult {
  text: string
  language: string
}

export async function getTranscript(
  videoId: string
): Promise<TranscriptResult | null> {
  // Tenta PT primeiro, depois EN
  const languages = ['pt', 'pt-BR', 'en']

  for (const lang of languages) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang,
      })

      if (transcript && transcript.length > 0) {
        const text = transcript
          .map((item) => item.text)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 8000) // Limite para não estourar contexto

        return { text, language: lang }
      }
    } catch {
      // Tenta próximo idioma
      continue
    }
  }

  return null
}
