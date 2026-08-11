import { maxSimilarity, tokenize } from "@/lib/similarity";
import type { DiscoveredIdea } from "./schemas";

/**
 * Idea scoring (FR-03). V0 is a deterministic heuristic over signals available
 * at discovery time, so it is fast and testable. Scores are 0..100 per
 * dimension; total is a weighted aggregate. Users can override in the UI.
 *
 * Dimensions: novelty, curiosity, consequenceStrength, channelFit, repeatRisk,
 * productionEase, policySafety, retentionPotential.
 */

export interface ScoreBreakdown {
  novelty: number;
  curiosity: number;
  consequenceStrength: number;
  channelFit: number;
  repeatRisk: number;
  productionEase: number;
  policySafety: number;
  retentionPotential: number;
}

export interface ScoredIdea {
  total: number;
  breakdown: ScoreBreakdown;
}

const KNOWN_ANGLE_TYPES = new Set([
  "hidden-cost", "quiet-shift", "second-order-effect", "who-pays",
  "incentive-trap", "erosion-over-time", "invisible-default", "feedback-loop",
  "displaced-skill", "measurement-illusion",
]);

// Weighting reflects the product principle: originality + retention over ease.
const WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  novelty: 0.18,
  curiosity: 0.14,
  consequenceStrength: 0.18,
  channelFit: 0.12,
  repeatRisk: 0.12, // already inverted (high = low risk = good)
  productionEase: 0.06,
  policySafety: 0.1,
  retentionPotential: 0.1,
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Specificity proxy: longer, concrete framing with mechanisms scores higher. */
function specificityScore(text: string): number {
  const tokens = tokenize(text);
  const hasNumbers = /\d/.test(text);
  const mechanismMarkers = /(because|through|so that|which means|leads to|results in|when|by)/i.test(
    text,
  );
  let score = Math.min(70, tokens.length * 2.2);
  if (hasNumbers) score += 12;
  if (mechanismMarkers) score += 18;
  return clamp(score);
}

export function scoreIdea(
  idea: DiscoveredIdea,
  recentTitles: string[],
): ScoredIdea {
  // Novelty / repeat risk from lexical similarity to recent titles.
  const sim = maxSimilarity(idea.working_title, recentTitles).score;
  const novelty = clamp((1 - sim) * 100);
  const repeatRisk = clamp((1 - sim) * 100); // stored as "safety": high = low risk

  // Curiosity: question-shaped or tension-bearing titles read as more curious.
  const title = idea.working_title.toLowerCase();
  let curiosity = 50;
  if (/^(why|how|the )/i.test(idea.working_title)) curiosity += 12;
  if (/(never|quietly|nobody|hidden|secret|no one|without)/i.test(title)) curiosity += 18;
  if (idea.working_title.split(/\s+/).length <= 9) curiosity += 8;
  curiosity = clamp(curiosity);

  const consequenceStrength = specificityScore(idea.consequence_framing);

  // Channel fit: recognized angle type + a real "why underdiscussed" rationale.
  let channelFit = KNOWN_ANGLE_TYPES.has(idea.angle_type) ? 70 : 45;
  channelFit += Math.min(25, tokenize(idea.why_underdiscussed).length);
  channelFit = clamp(channelFit);

  // Production ease: shorter, single-mechanism ideas are easier to produce.
  const productionEase = clamp(70 - Math.max(0, tokenize(idea.consequence_framing).length - 30));

  // Policy safety: presence of a real counterargument lowers overclaim risk.
  const policySafety = clamp(
    idea.controversy_note.trim().length > 20 ? 75 + Math.min(20, tokenize(idea.controversy_note).length) : 45,
  );

  // Retention potential: hidden angle specificity + curiosity blend.
  const retentionPotential = clamp(
    specificityScore(idea.hidden_angle) * 0.6 + curiosity * 0.4,
  );

  const breakdown: ScoreBreakdown = {
    novelty,
    curiosity,
    consequenceStrength,
    channelFit,
    repeatRisk,
    productionEase,
    policySafety,
    retentionPotential,
  };

  const total = clamp(
    (Object.keys(WEIGHTS) as (keyof ScoreBreakdown)[]).reduce(
      (acc, key) => acc + breakdown[key] * WEIGHTS[key],
      0,
    ),
  );

  return { total, breakdown };
}
