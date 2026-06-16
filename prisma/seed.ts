import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seeds one default channel for the AI side-effects thesis, plus the eight
 * editorial pillars from the spec (section 9.2). Idempotent: re-running updates
 * the existing channel/pillars by slug/name rather than duplicating them.
 */

const CHANNEL_SLUG = "ai-side-effects";

const TONE_PROFILE = {
  voice: "intelligent but clear",
  mood: "slightly unsettling, not sensationalist",
  signal: "high-signal, low-hype",
  hooks: "memorable without clickbait fraud",
  narration: "editorial, not robotic",
};

const BANNED_PATTERNS = [
  "AI is changing everything",
  "top AI tools",
  "generic AI news roundup",
  "templated slideshow voiceover",
  "vague claim without concrete consequence",
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
    name: "Labor and Work Side Effects",
    description:
      "Invisible labor displacement, role hollowing, and the quiet reshaping of how and whether people work.",
    keywords: "labor,jobs,automation,displacement,gig,white-collar,deskilling",
    weight: 0.7,
  },
  {
    name: "Education and Cognition Side Effects",
    description:
      "Cognitive offloading, memory erosion, dependency in learning, and distorted educational incentives.",
    keywords: "education,cognition,memory,learning,offloading,critical-thinking",
    weight: 0.7,
  },
  {
    name: "Media, Truth, and Persuasion Side Effects",
    description:
      "AI-fueled persuasion, synthetic media, trust collapse, and manufactured consensus.",
    keywords: "media,truth,persuasion,deepfakes,misinformation,manipulation",
    weight: 0.75,
  },
  {
    name: "Relationships and Social Trust Side Effects",
    description:
      "Erosion of interpersonal trust, parasocial AI bonds, and the reshaping of human connection.",
    keywords: "relationships,trust,loneliness,companions,social,connection",
    weight: 0.6,
  },
  {
    name: "Economic Concentration and Infrastructure Side Effects",
    description:
      "Compute and infrastructure concentration, geopolitical leverage, and systemic fragility.",
    keywords: "economy,infrastructure,compute,concentration,geopolitics,monopoly",
    weight: 0.6,
  },
  {
    name: "Law, Compliance, and Governance Side Effects",
    description:
      "Legal gray zones, compliance theater, accountability gaps, and governance blind spots.",
    keywords: "law,compliance,governance,regulation,liability,accountability",
    weight: 0.55,
  },
  {
    name: "Creativity and Culture Side Effects",
    description:
      "Creative homogenization, cultural flattening, and the economics of synthetic content.",
    keywords: "creativity,culture,art,homogenization,originality,aesthetics",
    weight: 0.6,
  },
  {
    name: "Psychological and Identity Side Effects",
    description:
      "Emotional consequences, identity shifts, agency erosion, and the psychology of delegation.",
    keywords: "psychology,identity,agency,emotion,wellbeing,self",
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
      name: "AI Side Effects",
      slug: CHANNEL_SLUG,
      description:
        "AI is changing the world in ways people are not talking about enough — especially the side effects.",
      niche: "AI second-order effects and under-discussed consequences",
      targetAudience:
        "Curious, intelligent English-speaking viewers interested in technology's hidden costs.",
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
    `Seeded channel "${channel.name}" (${channel.slug}) with ${pillarCount} editorial pillars.`,
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
