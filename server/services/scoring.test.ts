import { describe, it, expect } from "vitest";
import { scoreIdea } from "./scoring";
import type { DiscoveredIdea } from "./schemas";

const strong: DiscoveredIdea = {
  working_title: "The Junior Engineer Who Never Learns To Debug",
  hidden_angle:
    "AI coding tools remove the painful early failures that build debugging intuition, so the skill never forms.",
  why_underdiscussed:
    "Productivity metrics rise immediately, so the loss is invisible for years until a generation of seniors is missing.",
  consequence_framing:
    "In 5-8 years teams may have no engineers who can reason about a system when the AI is wrong, because the struggle that produced that ability was optimized away.",
  angle_type: "displaced-skill",
  controversy_note:
    "Counter: every abstraction drew the same fear and skills adapted. Risk of overstating that this one is categorically different.",
};

const generic: DiscoveredIdea = {
  working_title: "AI Is Changing Everything",
  hidden_angle: "AI is everywhere now.",
  why_underdiscussed: "People are busy.",
  consequence_framing: "Things will change a lot.",
  angle_type: "unknown",
  controversy_note: "",
};

describe("scoreIdea", () => {
  it("scores a specific, well-formed idea higher than a generic one", () => {
    expect(scoreIdea(strong, []).total).toBeGreaterThan(scoreIdea(generic, []).total);
  });

  it("produces all dimensions within 0..100", () => {
    const { breakdown } = scoreIdea(strong, []);
    for (const value of Object.values(breakdown)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it("drops novelty when the title repeats recent history", () => {
    const fresh = scoreIdea(strong, []).breakdown.novelty;
    const repeated = scoreIdea(strong, [strong.working_title]).breakdown.novelty;
    expect(repeated).toBeLessThan(fresh);
  });

  it("rewards a recognized angle type via channel fit", () => {
    const known = scoreIdea(strong, []).breakdown.channelFit;
    const unknown = scoreIdea({ ...strong, angle_type: "made-up" }, []).breakdown.channelFit;
    expect(known).toBeGreaterThan(unknown);
  });

  it("rewards a present counterargument via policy safety", () => {
    const withCounter = scoreIdea(strong, []).breakdown.policySafety;
    const without = scoreIdea({ ...strong, controversy_note: "" }, []).breakdown.policySafety;
    expect(withCounter).toBeGreaterThan(without);
  });
});
