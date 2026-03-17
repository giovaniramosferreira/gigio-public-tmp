import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface Slide {
  order: number
  type: 'cover' | 'content' | 'cta'
  title: string
  content: string
  emoji: string
  imageQuery: string   // query em inglês para buscar no Unsplash
  imageUrl?: string    // preenchido após busca no Unsplash
  altText: string      // texto alternativo para acessibilidade e SEO do Instagram
}

export interface HashtagGroups {
  small: string[]    // nicho < 100K posts — maior chance de rankear
  medium: string[]   // médias 100K–1M — alcance intermediário
  large: string[]    // amplas > 1M — visibilidade geral
}

export interface CarouselPost {
  slides: Slide[]
  caption: string           // legenda com hook + corpo + CTA de saves
  hashtags: string[]        // todos os hashtags combinados (retrocompat)
  hashtagGroups: HashtagGroups
  firstComment: string      // hashtags formatados para o primeiro comentário
}

export async function generateCarouselPost(
  video: {
    youtubeId: string
    title: string
    channelName: string
    viewCount: number
  },
  transcript: string
): Promise<CarouselPost | null> {
  const prompt = `Você é um especialista em crescimento orgânico no Instagram Brasil com foco em SEO e viralidade.

Com base no vídeo do YouTube abaixo, crie um post em carrossel otimizado para o algoritmo do Instagram.

VÍDEO:
Título: ${video.title}
Canal: ${video.channelName}
Visualizações: ${video.viewCount.toLocaleString('pt-BR')}
Link: https://youtube.com/watch?v=${video.youtubeId}

TRANSCRIÇÃO (parcial):
${transcript}

═══════════════════════════════════════
REGRAS DOS SLIDES (exatamente 6):
═══════════════════════════════════════
- Slide 1 (cover): Título provocador/curioso com máx 8 palavras. Deve gerar curiosidade imediata.
- Slides 2–5 (content): Um ponto surpreendente por slide. Título curto + 2-3 linhas diretas.
- Slide 6 (cta): "Assista o vídeo completo 👇" + URL. Emoji ▶️.
- Tom: informativo, direto, linguagem brasileira casual.
- NÃO resuma — destaque os fatos mais CURIOSOS e SURPREENDENTES.
- Objetivo: fazer o usuário salvar o post e querer assistir o vídeo original.

Para "imageQuery": query em INGLÊS para buscar foto de fundo no Unsplash.
- Seja específico e visual (ex: "ancient egyptian pyramid desert sunset").
- Evite queries abstratas — prefira cenas concretas.
- Slide 6: use "youtube play button screen dark".

Para "altText": descreva a imagem de fundo ideal para acessibilidade + SEO.
- Exemplo: "Pirâmides do Egito ao pôr do sol com céu alaranjado"
- Use português, seja descritivo mas conciso (máx 125 caracteres).
- Inclua a keyword principal do tema do slide naturalmente.

═══════════════════════════════════════
REGRAS DA LEGENDA (SEO + algoritmo):
═══════════════════════════════════════
A legenda deve seguir EXATAMENTE esta estrutura:

LINHA 1 — HOOK (aparece antes do "ver mais"):
- Uma frase que gera curiosidade ou choque imediato. Sem emoji no início.
- Ex: "O animal mais inteligente do oceano não é o golfinho."
- Deve conter a keyword principal do tema (para SEO da busca do Instagram).

LINHAS 2–4 — CORPO:
- 2-3 frases expandindo o hook. Linguagem natural, não de vendas.
- Repita a keyword principal 1-2x naturalmente.
- Use emojis com moderação (1-2 no máximo).

LINHA FINAL — CTA ORIENTADO A SAVES:
- Use uma dessas opções adaptada ao tema:
  • "Salva esse post — você vai querer reler isso."
  • "Manda pra alguém que precisa saber disso."
  • "Salva pra não perder esse conteúdo."
  • "Compartilha com quem te contou isso errado."

NÃO coloque hashtags na legenda — elas vão no primeiro comentário.

═══════════════════════════════════════
REGRAS DOS HASHTAGS (mix estratégico):
═══════════════════════════════════════
Gere 3 grupos estratégicos. Todos em português (sem acento, sem espaço):

"small" — 5 hashtags de nicho (<100K posts): maior chance de rankear no topo da hashtag.
Ex: curiosidadeshistoricas, fatoraros, historiareal, descobertascientificas, sabiaquenao

"medium" — 5 hashtags médias (100K–1M posts): alcance intermediário.
Ex: curiosidades, historia, ciencia, conhecimento, aprender

"large" — 3 hashtags amplas (>1M posts): visibilidade máxima mas competição alta.
Ex: viral, vocedevia, aprenda

"firstComment": todos os 13 hashtags com # na frente, separados por espaço.
Ex: "#curiosidadeshistoricas #fatoraros ..."

═══════════════════════════════════════

Retorne APENAS JSON válido neste formato exato, sem texto antes ou depois:
{
  "slides": [
    { "order": 1, "type": "cover", "title": "", "content": "", "emoji": "", "imageQuery": "", "altText": "" },
    { "order": 2, "type": "content", "title": "", "content": "", "emoji": "", "imageQuery": "", "altText": "" },
    { "order": 3, "type": "content", "title": "", "content": "", "emoji": "", "imageQuery": "", "altText": "" },
    { "order": 4, "type": "content", "title": "", "content": "", "emoji": "", "imageQuery": "", "altText": "" },
    { "order": 5, "type": "content", "title": "", "content": "", "emoji": "", "imageQuery": "", "altText": "" },
    { "order": 6, "type": "cta", "title": "Assista o vídeo completo 👇", "content": "https://youtube.com/watch?v=${video.youtubeId}", "emoji": "▶️", "imageQuery": "youtube play button screen dark", "altText": "Botão play do YouTube em tela escura" }
  ],
  "caption": "hook forte na primeira linha\\n\\ncorpo do texto aqui\\n\\nCTA de saves aqui",
  "hashtags": ["tag1", "tag2"],
  "hashtagGroups": {
    "small": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "medium": ["tag6", "tag7", "tag8", "tag9", "tag10"],
    "large": ["tag11", "tag12", "tag13"]
  },
  "firstComment": "#tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10 #tag11 #tag12 #tag13"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2400,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as any).text)
      .join('')

    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean) as CarouselPost

    // Ensure hashtags array is populated from groups if empty
    if (!parsed.hashtags?.length && parsed.hashtagGroups) {
      parsed.hashtags = [
        ...parsed.hashtagGroups.small,
        ...parsed.hashtagGroups.medium,
        ...parsed.hashtagGroups.large,
      ]
    }

    return parsed
  } catch (error) {
    console.error('Erro ao gerar carousel com Claude:', error)
    return null
  }
}
