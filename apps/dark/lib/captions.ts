/**
 * Caption generation utilities (FR-09). Converts word- or segment-level timing
 * into SRT and VTT subtitle formats. Pure functions, unit-testable without any
 * provider or FFmpeg dependency.
 */

export interface TimedWord {
  word: string;
  start: number; // seconds
  end: number; // seconds
}

export interface CaptionCue {
  index: number;
  start: number;
  end: number;
  text: string;
}

/** Format seconds as SRT timestamp: HH:MM:SS,mmm */
export function srtTimestamp(seconds: number): string {
  return formatTimestamp(seconds, ",");
}

/** Format seconds as VTT timestamp: HH:MM:SS.mmm */
export function vttTimestamp(seconds: number): string {
  return formatTimestamp(seconds, ".");
}

function formatTimestamp(seconds: number, msSep: string): string {
  const clamped = Math.max(0, seconds);
  const hh = Math.floor(clamped / 3600);
  const mm = Math.floor((clamped % 3600) / 60);
  const ss = Math.floor(clamped % 60);
  const ms = Math.round((clamped - Math.floor(clamped)) * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}${msSep}${pad(ms, 3)}`;
}

/**
 * Group timed words into caption cues for Shorts readability: short lines, a
 * max word count per cue, and a max on-screen duration. Cues never overlap.
 */
export function groupWordsIntoCues(
  words: TimedWord[],
  opts: { maxWords?: number; maxChars?: number; maxDurationSec?: number } = {},
): CaptionCue[] {
  const { maxWords = 5, maxChars = 42, maxDurationSec = 3.5 } = opts;
  const cues: CaptionCue[] = [];
  let current: TimedWord[] = [];

  const flush = () => {
    if (current.length === 0) return;
    const text = current.map((w) => w.word).join(" ").trim();
    cues.push({
      index: cues.length + 1,
      start: current[0].start,
      end: current[current.length - 1].end,
      text,
    });
    current = [];
  };

  for (const w of words) {
    const tentative = [...current, w];
    const text = tentative.map((x) => x.word).join(" ");
    const duration = w.end - tentative[0].start;
    if (
      current.length > 0 &&
      (tentative.length > maxWords || text.length > maxChars || duration > maxDurationSec)
    ) {
      flush();
    }
    current.push(w);
  }
  flush();
  return cues;
}

export function cuesToSrt(cues: CaptionCue[]): string {
  return cues
    .map(
      (c) =>
        `${c.index}\n${srtTimestamp(c.start)} --> ${srtTimestamp(c.end)}\n${c.text}\n`,
    )
    .join("\n");
}

export function cuesToVtt(cues: CaptionCue[]): string {
  const body = cues
    .map(
      (c) =>
        `${vttTimestamp(c.start)} --> ${vttTimestamp(c.end)}\n${c.text}\n`,
    )
    .join("\n");
  return `WEBVTT\n\n${body}`;
}

/**
 * Build approximate word timings from a script and a known total audio
 * duration when the TTS provider does not return word-level timestamps.
 * Distributes time proportionally to word length (a reasonable proxy).
 */
export function estimateWordTimings(
  script: string,
  totalDurationSec: number,
): TimedWord[] {
  const words = script.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const weights = words.map((w) => Math.max(1, w.replace(/[^a-zA-Z0-9]/g, "").length));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let t = 0;
  return words.map((word, i) => {
    const dur = (weights[i] / totalWeight) * totalDurationSec;
    const start = t;
    t += dur;
    return { word, start, end: t };
  });
}
