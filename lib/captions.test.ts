import { describe, it, expect } from "vitest";
import {
  srtTimestamp,
  vttTimestamp,
  groupWordsIntoCues,
  cuesToSrt,
  cuesToVtt,
  estimateWordTimings,
  type TimedWord,
} from "./captions";

describe("timestamps", () => {
  it("formats SRT with comma milliseconds", () => {
    expect(srtTimestamp(3661.5)).toBe("01:01:01,500");
  });
  it("formats VTT with dot milliseconds", () => {
    expect(vttTimestamp(3661.5)).toBe("01:01:01.500");
  });
  it("clamps negative time to zero", () => {
    expect(srtTimestamp(-5)).toBe("00:00:00,000");
  });
});

const words: TimedWord[] = [
  { word: "AI", start: 0, end: 0.4 },
  { word: "quietly", start: 0.4, end: 0.9 },
  { word: "erases", start: 0.9, end: 1.4 },
  { word: "debugging", start: 1.4, end: 2.0 },
  { word: "intuition", start: 2.0, end: 2.6 },
  { word: "over", start: 2.6, end: 2.9 },
  { word: "time", start: 2.9, end: 3.3 },
];

describe("groupWordsIntoCues", () => {
  it("respects the max words per cue", () => {
    const cues = groupWordsIntoCues(words, { maxWords: 3, maxDurationSec: 99, maxChars: 999 });
    expect(cues.every((c) => c.text.split(" ").length <= 3)).toBe(true);
  });
  it("produces contiguous, non-overlapping cues", () => {
    const cues = groupWordsIntoCues(words);
    for (let i = 1; i < cues.length; i++) {
      expect(cues[i].start).toBeGreaterThanOrEqual(cues[i - 1].end - 1e-9);
    }
  });
  it("returns empty for empty input", () => {
    expect(groupWordsIntoCues([])).toEqual([]);
  });
});

describe("serialization", () => {
  it("emits numbered SRT blocks", () => {
    const srt = cuesToSrt(groupWordsIntoCues(words, { maxWords: 3 }));
    expect(srt).toMatch(/^1\n00:00:00,000 --> /);
    expect(srt).toContain("-->");
  });
  it("emits a WEBVTT header", () => {
    const vtt = cuesToVtt(groupWordsIntoCues(words));
    expect(vtt.startsWith("WEBVTT")).toBe(true);
  });
});

describe("estimateWordTimings", () => {
  it("spans the full duration", () => {
    const timings = estimateWordTimings("one two three four five", 10);
    expect(timings).toHaveLength(5);
    expect(timings[0].start).toBe(0);
    expect(timings[timings.length - 1].end).toBeCloseTo(10, 5);
  });
  it("returns empty for empty script", () => {
    expect(estimateWordTimings("", 10)).toEqual([]);
  });
});
