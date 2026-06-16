import { log } from "@/lib/logger";
import { analyticsRepo } from "@/server/repositories/analytics";

const logger = log("learning");

export interface PillarPerformance {
  pillar: string;
  videos: number;
  avgViews: number;
  avgViewedPct: number;
}

export interface DurationBucket {
  label: string;
  videos: number;
  avgViewedPct: number;
}

export interface TitlePattern {
  pattern: string;
  videos: number;
  avgViews: number;
}

export interface LearningInsights {
  sampleSize: number;
  topPillars: PillarPerformance[];
  durationWindows: DurationBucket[];
  titlePatterns: TitlePattern[];
  recommendations: string[];
}

const TITLE_PATTERNS: Array<{ label: string; test: (t: string) => boolean }> = [
  { label: "Starts with 'Why'", test: (t) => /^why\b/i.test(t) },
  { label: "Starts with 'How'", test: (t) => /^how\b/i.test(t) },
  { label: "'The hidden ...'", test: (t) => /\bhidden\b/i.test(t) },
  { label: "'... nobody/no one ...'", test: (t) => /\b(nobody|no one)\b/i.test(t) },
  { label: "'quiet/quietly'", test: (t) => /\bquiet(ly)?\b/i.test(t) },
];

function avg(nums: number[]): number {
  const valid = nums.filter((n) => Number.isFinite(n));
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

/**
 * Learning loop (FR-17). Derives actionable insights from analytics snapshots:
 * strongest pillars, ideal duration window, strongest title patterns, and plain
 * recommendations. Deterministic and safe on sparse/empty data (returns empty
 * insights with an explanatory recommendation).
 */
export async function computeInsights(channelId: string): Promise<LearningInsights> {
  const snapshots = await analyticsRepo.listLatestForChannel(channelId);

  if (snapshots.length === 0) {
    return {
      sampleSize: 0,
      topPillars: [],
      durationWindows: [],
      titlePatterns: [],
      recommendations: [
        "No analytics yet. Publish and import performance data to unlock learnings.",
      ],
    };
  }

  // Keep one (latest) snapshot per video.
  const byVideo = new Map<string, (typeof snapshots)[number]>();
  for (const s of snapshots) {
    if (!byVideo.has(s.videoProjectId)) byVideo.set(s.videoProjectId, s);
  }
  const rows = [...byVideo.values()];

  // ---- Pillar performance ----
  const pillarMap = new Map<string, { views: number[]; pct: number[] }>();
  for (const r of rows) {
    const pillar = r.videoProject.scriptPackage?.contentIdea.pillar?.name ?? "Unassigned";
    const bucket = pillarMap.get(pillar) ?? { views: [], pct: [] };
    bucket.views.push(r.views);
    if (r.averageViewPercentage != null) bucket.pct.push(r.averageViewPercentage);
    pillarMap.set(pillar, bucket);
  }
  const topPillars: PillarPerformance[] = [...pillarMap.entries()]
    .map(([pillar, b]) => ({
      pillar,
      videos: b.views.length,
      avgViews: Math.round(avg(b.views)),
      avgViewedPct: Math.round(avg(b.pct)),
    }))
    .sort((a, b) => b.avgViews - a.avgViews);

  // ---- Duration windows ----
  const buckets: Record<string, { pct: number[] }> = {
    "< 30s": { pct: [] },
    "30-40s": { pct: [] },
    "40-50s": { pct: [] },
    "> 50s": { pct: [] },
  };
  for (const r of rows) {
    const d = r.videoProject.durationSeconds ?? 0;
    const key = d < 30 ? "< 30s" : d <= 40 ? "30-40s" : d <= 50 ? "40-50s" : "> 50s";
    if (r.averageViewPercentage != null) buckets[key].pct.push(r.averageViewPercentage);
  }
  const durationWindows: DurationBucket[] = Object.entries(buckets).map(([label, b]) => ({
    label,
    videos: b.pct.length,
    avgViewedPct: Math.round(avg(b.pct)),
  }));

  // ---- Title patterns ----
  const titlePatterns: TitlePattern[] = TITLE_PATTERNS.map((p) => {
    const matched = rows.filter((r) => p.test(r.videoProject.title));
    return {
      pattern: p.label,
      videos: matched.length,
      avgViews: Math.round(avg(matched.map((r) => r.views))),
    };
  })
    .filter((p) => p.videos > 0)
    .sort((a, b) => b.avgViews - a.avgViews);

  // ---- Recommendations ----
  const recommendations: string[] = [];
  if (topPillars[0]) {
    recommendations.push(
      `"${topPillars[0].pillar}" is the strongest pillar by avg views — schedule more here.`,
    );
  }
  const bestDuration = durationWindows
    .filter((d) => d.videos > 0)
    .sort((a, b) => b.avgViewedPct - a.avgViewedPct)[0];
  if (bestDuration) {
    recommendations.push(
      `Best retention is in the ${bestDuration.label} window — target that length.`,
    );
  }
  if (titlePatterns[0]) {
    recommendations.push(
      `Title pattern "${titlePatterns[0].pattern}" performs best on views.`,
    );
  }

  logger.info({ channelId, sampleSize: rows.length }, "insights computed");
  return {
    sampleSize: rows.length,
    topPillars,
    durationWindows,
    titlePatterns,
    recommendations,
  };
}
