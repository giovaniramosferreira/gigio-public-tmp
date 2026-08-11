import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock env thresholds and the Prisma client before importing the service.
vi.mock("@/lib/env", () => ({
  env: {
    ORIGINALITY_BLOCK_THRESHOLD: 0.4,
    REUSED_RISK_BLOCK_THRESHOLD: 0.7,
    SIMILARITY_REVIEW_THRESHOLD: 0.75,
  },
}));

const findMany = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: { scriptPackage: { findMany: (...args: unknown[]) => findMany(...args) } },
}));

import { checkOriginality } from "./originality";

const candidate = {
  title: "The Junior Engineer Who Never Learns To Debug",
  selected_hook: "Your best junior dev will never learn to debug.",
  thesis: "AI assistants quietly erase the failure-driven learning that builds senior engineers.",
  full_script: "Everyone celebrates faster shipping, but the struggle that forged debugging intuition is being optimized away.",
};

describe("checkOriginality", () => {
  beforeEach(() => findMany.mockReset());

  it("passes with high originality against empty history", async () => {
    findMany.mockResolvedValue([]);
    const report = await checkOriginality("chan", candidate);
    expect(report.decision).toBe("PASS");
    expect(report.aggregateOriginality).toBeCloseTo(1, 5);
  });

  it("blocks a near-duplicate package", async () => {
    findMany.mockResolvedValue([
      {
        title: candidate.title,
        selectedHook: candidate.selected_hook,
        thesis: candidate.thesis,
        fullScript: candidate.full_script,
      },
    ]);
    const report = await checkOriginality("chan", candidate);
    expect(report.decision).toBe("BLOCK");
    expect(report.flaggedAgainst).toBeDefined();
  });

  it("returns one originality entry per dimension", async () => {
    findMany.mockResolvedValue([]);
    const report = await checkOriginality("chan", candidate);
    expect(report.dimensions.map((d) => d.name).sort()).toEqual(
      ["narrative", "opening", "thesis", "title"],
    );
  });
});
