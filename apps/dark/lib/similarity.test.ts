import { describe, it, expect } from "vitest";
import { tokenize, jaccard, shingleSimilarity, maxSimilarity } from "./similarity";

describe("tokenize", () => {
  it("lowercases, strips punctuation, removes stopwords", () => {
    expect(tokenize("The Hidden Cost of AI!")).toEqual(["hidden", "cost"]);
  });

  it("drops single-character tokens", () => {
    expect(tokenize("a b cd ef")).toEqual(["cd", "ef"]);
  });
});

describe("jaccard", () => {
  it("is 1 for identical meaningful content", () => {
    expect(jaccard("labor displacement risk", "labor displacement risk")).toBe(1);
  });

  it("is 0 for disjoint content", () => {
    expect(jaccard("labor displacement", "cooking pasta")).toBe(0);
  });

  it("is between 0 and 1 for partial overlap", () => {
    const s = jaccard("ai erodes critical thinking", "ai erodes memory");
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });
});

describe("shingleSimilarity", () => {
  it("detects shared phrase ordering", () => {
    const s = shingleSimilarity(
      "junior engineers never learn to debug systems",
      "junior engineers never learn to ship systems",
      3,
    );
    expect(s).toBeGreaterThan(0);
  });

  it("is 0 when no shared trigram exists", () => {
    expect(shingleSimilarity("alpha beta gamma", "delta epsilon zeta", 3)).toBe(0);
  });
});

describe("maxSimilarity", () => {
  it("returns the closest match and its index", () => {
    const corpus = ["cooking recipes", "labor displacement in tech", "travel tips"];
    const { score, index } = maxSimilarity("labor displacement in tech", corpus);
    expect(index).toBe(1);
    expect(score).toBe(1);
  });

  it("returns 0 score and -1 index against an empty corpus", () => {
    const { score, index } = maxSimilarity("anything", []);
    expect(score).toBe(0);
    expect(index).toBe(-1);
  });
});
