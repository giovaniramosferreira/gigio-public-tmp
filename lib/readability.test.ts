import { describe, it, expect } from "vitest";
import { scoreThumbnailText, readabilityRating } from "./readability";

describe("scoreThumbnailText", () => {
  it("scores a short punchy overlay as strong", () => {
    expect(scoreThumbnailText("Skill Debt")).toBeGreaterThanOrEqual(70);
  });

  it("penalizes long, wordy overlays", () => {
    const short = scoreThumbnailText("Hidden Cost");
    const long = scoreThumbnailText(
      "The Hidden Cost Of Artificial Intelligence Nobody Is Talking About Yet",
    );
    expect(long).toBeLessThan(short);
  });

  it("returns 0 for empty text", () => {
    expect(scoreThumbnailText("   ")).toBe(0);
  });

  it("penalizes cluttered punctuation", () => {
    const clean = scoreThumbnailText("Quiet Collapse");
    const cluttered = scoreThumbnailText("Quiet, Slow: Collapse");
    expect(cluttered).toBeLessThan(clean);
  });
});

describe("readabilityRating", () => {
  it("maps score bands to ratings", () => {
    expect(readabilityRating(85)).toBe("strong");
    expect(readabilityRating(55)).toBe("ok");
    expect(readabilityRating(20)).toBe("weak");
  });
});
