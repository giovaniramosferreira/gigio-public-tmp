import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { maxSimilarity } from "@/lib/similarity";
import type { ScriptPackageOutput } from "./schemas";

/**
 * Originality guard (FR-05, policy-framework section 3). Compares a candidate
 * script package against historical scripts on multiple dimensions and returns
 * a per-dimension breakdown plus an aggregate decision. V1 uses deterministic
 * lexical similarity (see lib/similarity). Higher similarity = lower originality.
 */

export type OriginalityDecision = "PASS" | "REVIEW" | "BLOCK";

export interface OriginalityDimension {
  name: string;
  similarity: number; // 0..1, max against history
  originality: number; // 0..100 (100 = fully original)
}

export interface OriginalityReport {
  decision: OriginalityDecision;
  aggregateOriginality: number; // 0..1
  dimensions: OriginalityDimension[];
  flaggedAgainst?: { dimension: string; similarity: number };
}

interface HistoryRecord {
  title: string;
  selectedHook: string | null;
  thesis: string | null;
  fullScript: string | null;
}

function dimension(
  name: string,
  text: string,
  corpus: string[],
): OriginalityDimension {
  const { score } = maxSimilarity(text, corpus.filter(Boolean));
  return { name, similarity: score, originality: Math.round((1 - score) * 100) };
}

/**
 * Run the originality guard for a candidate package, excluding the script's own
 * record (by scriptPackageId) from the comparison history.
 */
export async function checkOriginality(
  channelId: string,
  candidate: Pick<ScriptPackageOutput, "selected_hook" | "thesis" | "full_script"> & {
    title: string;
  },
  excludeScriptId?: string,
): Promise<OriginalityReport> {
  const history = (await prisma.scriptPackage.findMany({
    where: {
      contentIdea: { channelId },
      ...(excludeScriptId ? { id: { not: excludeScriptId } } : {}),
    },
    select: { title: true, selectedHook: true, thesis: true, fullScript: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  })) as HistoryRecord[];

  const titles = history.map((h) => h.title);
  const hooks = history.map((h) => h.selectedHook ?? "");
  const theses = history.map((h) => h.thesis ?? "");
  const scripts = history.map((h) => h.fullScript ?? "");

  const dimensions: OriginalityDimension[] = [
    dimension("title", candidate.title, titles),
    dimension("opening", candidate.selected_hook, hooks),
    dimension("thesis", candidate.thesis, theses),
    dimension("narrative", candidate.full_script, scripts),
  ];

  // Aggregate originality is the mean across dimensions.
  const aggregateOriginality =
    dimensions.reduce((acc, d) => acc + d.originality / 100, 0) / dimensions.length;

  // Worst (highest-similarity) dimension drives review/block escalation.
  const worst = dimensions.reduce((a, b) => (b.similarity > a.similarity ? b : a));

  let decision: OriginalityDecision = "PASS";
  if (
    1 - aggregateOriginality > env.REUSED_RISK_BLOCK_THRESHOLD ||
    aggregateOriginality < env.ORIGINALITY_BLOCK_THRESHOLD
  ) {
    decision = "BLOCK";
  } else if (worst.similarity >= env.SIMILARITY_REVIEW_THRESHOLD) {
    decision = "REVIEW";
  }

  return {
    decision,
    aggregateOriginality,
    dimensions,
    flaggedAgainst:
      decision === "PASS"
        ? undefined
        : { dimension: worst.name, similarity: worst.similarity },
  };
}
