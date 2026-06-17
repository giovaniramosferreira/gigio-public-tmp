import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Semeie um canal padrão para a tese de efeitos colaterais da IA, mais os oito
 * pilares editoriais da especificação (seção 9.2). Idempotente: re-executar atualiza
 * o canal/pilares existentes por slug/nome em vez de duplicá-los.
 */

const CHANNEL_SLUG = "efeitos-colaterais-da-ia";

const TONE_PROFILE = {
  voice: "inteligente mas claro",
  mood: "levemente perturbador, não sensacionalista",
  signal: "alto sinal, baixo hype",
  hooks: "memorável sem fraude de clickbait",
  narration: "editorial, não robótico",
};

const BANNED_PATTERNS = [
  "A IA está mudando tudo",
  "melhores ferramentas de IA",
  "resumo genérico de notícias de IA",
  "narração de slideshow padronizado",
  "afirmação vaga sem consequência concreta",
];

const RENDER_DEFAULTS = {
  aspectRatio: "9:16",
  resolution: "1080x1920",
  frameRate: 30,
  targetDurationSeconds: { min: 30, max: 50 },
  captions: { mode: "burn-in", style: "shorts-readable" },
};

const PILLARS = [
  {
    name: "Efeitos Colaterais no Trabalho e Emprego",
    description:
      "Deslocamento invisível de trabalho, esvaziamento de funções e a reconfiguração silenciosa de como e se as pessoas trabalham.",
    keywords: "trabalho,empregos,automação,deslocamento,gig,colarinho-branco,desqualificação",
    weight: 0.7,
  },
  {
    name: "Efeitos Colaterais na Educação e Cognição",
    description:
      "Transferência cognitiva, erosão da memória, dependência no aprendizado e incentivos educacionais distorcidos.",
    keywords: "educação,cognição,memória,aprendizado,transferência,pensamento-crítico",
    weight: 0.7,
  },
  {
    name: "Efeitos Colaterais na Mídia, Verdade e Persuasão",
    description:
      "Persuasão alimentada por IA, mídia sintética, colapso de confiança e consenso fabricado.",
    keywords: "mídia,verdade,persuasão,deepfakes,desinformação,manipulação",
    weight: 0.75,
  },
  {
    name: "Efeitos Colaterais nos Relacionamentos e Confiança Social",
    description:
      "Erosão da confiança interpessoal, vínculos parassociais com IA e a reconfiguração da conexão humana.",
    keywords: "relacionamentos,confiança,solidão,companheiros,social,conexão",
    weight: 0.6,
  },
  {
    name: "Efeitos Colaterais na Concentração Econômica e Infraestrutura",
    description:
      "Concentração de computação e infraestrutura, alavancagem geopolítica e fragilidade sistêmica.",
    keywords: "economia,infraestrutura,computação,concentração,geopolítica,monopólio",
    weight: 0.6,
  },
  {
    name: "Efeitos Colaterais em Direito, Conformidade e Governança",
    description:
      "Zonas cinzentas legais, teatro de conformidade, lacunas de responsabilidade e pontos cegos de governança.",
    keywords: "direito,conformidade,governança,regulação,responsabilidade,accountability",
    weight: 0.55,
  },
  {
    name: "Efeitos Colaterais na Criatividade e Cultura",
    description:
      "Homogeneização criativa, achatamento cultural e a economia do conteúdo sintético.",
    keywords: "criatividade,cultura,arte,homogeneização,originalidade,estética",
    weight: 0.6,
  },
  {
    name: "Efeitos Colaterais Psicológicos e de Identidade",
    description:
      "Consequências emocionais, mudanças de identidade, erosão da agência e a psicologia da delegação.",
    keywords: "psicologia,identidade,agência,emoção,bem-estar,eu",
    weight: 0.6,
  },
];

async function main() {
  const channel = await prisma.channel.upsert({
    where: { slug: CHANNEL_SLUG },
    update: {
      isActive: true,
      toneProfileJson: JSON.stringify(TONE_PROFILE),
      bannedPatternsJson: JSON.stringify(BANNED_PATTERNS),
      renderDefaultsJson: JSON.stringify(RENDER_DEFAULTS),
    },
    create: {
      name: "Efeitos Colaterais da IA",
      slug: CHANNEL_SLUG,
      description:
        "A IA está mudando o mundo de maneiras que as pessoas não estão discutindo o suficiente — especialmente os efeitos colaterais.",
      niche: "Efeitos de segunda ordem da IA e consequências pouco discutidas",
      targetAudience:
        "Espectadores curiosos e inteligentes interessados nos custos ocultos da tecnologia.",
      toneProfileJson: JSON.stringify(TONE_PROFILE),
      bannedPatternsJson: JSON.stringify(BANNED_PATTERNS),
      renderDefaultsJson: JSON.stringify(RENDER_DEFAULTS),
      reviewMode: "review-before-publish",
      isActive: true,
      defaultVoiceProvider: "elevenlabs",
    },
  });

  for (const pillar of PILLARS) {
    const existing = await prisma.editorialPillar.findFirst({
      where: { channelId: channel.id, name: pillar.name },
    });
    if (existing) {
      await prisma.editorialPillar.update({
        where: { id: existing.id },
        data: { ...pillar, active: true },
      });
    } else {
      await prisma.editorialPillar.create({
        data: { ...pillar, channelId: channel.id, active: true },
      });
    }
  }

  const pillarCount = await prisma.editorialPillar.count({
    where: { channelId: channel.id },
  });

  console.log(
    `Canal "${channel.name}" (${channel.slug}) semeado com ${pillarCount} pilares editoriais.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
