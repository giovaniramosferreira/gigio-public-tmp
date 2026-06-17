import { generateJson } from "@/lib/llm-json";
import { log } from "@/lib/logger";
import { channelRepo } from "@/server/repositories/channel";
import { ideaRepo } from "@/server/repositories/idea";
import { discoveryResultSchema } from "./schemas";
import { scoreIdea } from "./scoring";

const logger = log("discovery");

const CHANNEL_THESIS =
  "A IA está mudando o mundo de maneiras que as pessoas não estão discutindo o suficiente — especialmente os efeitos colaterais.";

export interface DiscoverInput {
  channelId: string;
  pillarId?: string;
  seedPhrases?: string;
  count?: number;
}

export interface DiscoverResult {
  created: number;
  ideaIds: string[];
}

/**
 * Discovery + scoring pipeline (FR-02, FR-03). Generates >= count idea
 * candidates for a pillar, scores each heuristically, and persists them as
 * SCORED ideas ready for selection.
 */
export async function discoverIdeas(input: DiscoverInput): Promise<DiscoverResult> {
  const count = Math.max(25, input.count ?? 25);
  const channel = await channelRepo.findById(input.channelId);
  if (!channel) throw new Error(`Channel ${input.channelId} not found`);

  const pillar = input.pillarId
    ? channel.pillars.find((p) => p.id === input.pillarId)
    : channel.pillars[0];
  if (!pillar) throw new Error("No editorial pillar available for discovery");

  const recentTitles = await ideaRepo.recentTitles(input.channelId, 40);
  const bannedPatterns: string[] = channel.bannedPatternsJson
    ? JSON.parse(channel.bannedPatternsJson)
    : [];

  const { data, model, promptVersion } = await generateJson(
    "discovery/discover-ideas",
    {
      channel_thesis: CHANNEL_THESIS,
      pillar_name: pillar.name,
      pillar_description: pillar.description ?? "",
      seed_phrases: input.seedPhrases ?? pillar.keywords ?? "",
      recent_titles: recentTitles.join("\n"),
      banned_patterns: bannedPatterns.join("\n"),
      count,
    },
    discoveryResultSchema,
    { maxTokens: 8192, temperature: 1 },
  );

  logger.info({ generated: data.length, pillar: pillar.name }, "ideas generated");

  const ideaIds: string[] = [];
  for (const idea of data) {
    const scored = scoreIdea(idea, recentTitles);
    const created = await ideaRepo.create({
      channel: { connect: { id: channel.id } },
      pillar: { connect: { id: pillar.id } },
      title: idea.working_title,
      angle: idea.hidden_angle,
      hook: idea.consequence_framing,
      whyUnderdiscussed: idea.why_underdiscussed,
      status: "SCORED",
      totalScore: scored.total,
      scoreBreakdownJson: JSON.stringify({
        ...scored.breakdown,
        angleType: idea.angle_type,
        controversyNote: idea.controversy_note,
      }),
      source: "llm-discovery",
      seedPhrase: input.seedPhrases ?? null,
      originalityScore: scored.breakdown.novelty,
    });
    ideaIds.push(created.id);
  }

  logger.info({ created: ideaIds.length, model, promptVersion }, "ideas persisted");
  return { created: ideaIds.length, ideaIds };
}
