import { describe, it, expect, vi, beforeEach } from "vitest";

const listLatestForChannel = vi.fn();
vi.mock("@/server/repositories/analytics", () => ({
  analyticsRepo: { listLatestForChannel: (...a: unknown[]) => listLatestForChannel(...a) },
}));

import { computeInsights } from "./learning";

function snapshot(opts: {
  videoId: string;
  title: string;
  pillar: string;
  duration: number;
  views: number;
  pct: number;
}) {
  return {
    videoProjectId: opts.videoId,
    views: opts.views,
    averageViewPercentage: opts.pct,
    videoProject: {
      title: opts.title,
      durationSeconds: opts.duration,
      scriptPackage: { contentIdea: { pillar: { name: opts.pillar } } },
    },
  };
}

describe("computeInsights", () => {
  beforeEach(() => listLatestForChannel.mockReset());

  it("returns an explanatory recommendation when there is no data", async () => {
    listLatestForChannel.mockResolvedValue([]);
    const insights = await computeInsights("chan");
    expect(insights.sampleSize).toBe(0);
    expect(insights.recommendations[0]).toMatch(/Nenhuma análise/);
  });

  it("ranks the strongest pillar by average views", async () => {
    listLatestForChannel.mockResolvedValue([
      snapshot({ videoId: "v1", title: "Why X", pillar: "Labor", duration: 35, views: 1000, pct: 70 }),
      snapshot({ videoId: "v2", title: "How Y", pillar: "Cognition", duration: 45, views: 200, pct: 60 }),
    ]);
    const insights = await computeInsights("chan");
    expect(insights.sampleSize).toBe(2);
    expect(insights.topPillars[0].pillar).toBe("Labor");
    expect(insights.recommendations.join(" ")).toMatch(/Labor/);
  });

  it("detects title patterns present in the data", async () => {
    listLatestForChannel.mockResolvedValue([
      snapshot({ videoId: "v1", title: "Por que X acontece", pillar: "Labor", duration: 35, views: 500, pct: 70 }),
    ]);
    const insights = await computeInsights("chan");
    expect(insights.titlePatterns.some((p) => p.pattern.includes("Por que"))).toBe(true);
  });
});
