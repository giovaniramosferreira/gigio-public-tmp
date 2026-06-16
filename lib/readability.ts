/**
 * Thumbnail readability heuristic (FR-11). Scores overlay text for Shorts
 * legibility without a vision model: short, punchy, high-contrast-friendly text
 * reads better at small sizes. Returns 0..100. A vision-model upgrade is noted
 * in the docs. Pure and unit-testable.
 */
export function scoreThumbnailText(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  const words = trimmed.split(/\s+/).filter(Boolean);
  const chars = trimmed.length;

  let score = 100;

  // Penalize long text: ideal is 2-5 words for a Shorts cover.
  if (words.length > 5) score -= (words.length - 5) * 9;
  if (words.length < 2) score -= 15;

  // Penalize excessive characters (hard to read at thumbnail size).
  if (chars > 28) score -= (chars - 28) * 1.5;

  // Penalize long words (wrap/overflow risk).
  const longestWord = Math.max(...words.map((w) => w.length));
  if (longestWord > 12) score -= (longestWord - 12) * 3;

  // Reward strong, scannable punctuation; penalize cluttered punctuation.
  const punctCount = (trimmed.match(/[,;:]/g) ?? []).length;
  score -= punctCount * 6;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export type ReadabilityRating = "strong" | "ok" | "weak";

export function readabilityRating(score: number): ReadabilityRating {
  if (score >= 70) return "strong";
  if (score >= 45) return "ok";
  return "weak";
}
