/**
 * Lightweight text-similarity heuristics for the originality guard and idea
 * scoring. V1 is deliberately dependency-free and deterministic (no embeddings)
 * so it is fast, local, and unit-testable. Embeddings are a documented upgrade.
 */

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "is", "are", "was", "were", "be", "been", "being", "this", "that", "these",
  "those", "it", "its", "as", "at", "by", "from", "how", "why", "what", "when",
  "your", "you", "they", "their", "we", "our", "i", "ai",
]);

/** Normalize and tokenize text into meaningful lowercase word tokens. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Jaccard similarity over unique token sets. Range 0..1. */
export function jaccard(a: string, b: string): number {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Build word n-gram shingles (default trigrams) from tokens. */
export function shingles(text: string, n = 3): Set<string> {
  const tokens = tokenize(text);
  const out = new Set<string>();
  if (tokens.length < n) {
    if (tokens.length > 0) out.add(tokens.join(" "));
    return out;
  }
  for (let i = 0; i <= tokens.length - n; i++) {
    out.add(tokens.slice(i, i + n).join(" "));
  }
  return out;
}

/** Shingle-overlap similarity (containment-style), good for opening patterns. */
export function shingleSimilarity(a: string, b: string, n = 3): number {
  const sa = shingles(a, n);
  const sb = shingles(b, n);
  if (sa.size === 0 || sb.size === 0) return 0;
  let intersection = 0;
  for (const s of sa) if (sb.has(s)) intersection++;
  const smaller = Math.min(sa.size, sb.size);
  return smaller === 0 ? 0 : intersection / smaller;
}

/**
 * Maximum similarity of `text` against any item in `corpus`, combining token
 * Jaccard and trigram-shingle overlap (the max of the two, to catch both
 * vocabulary reuse and phrase reuse). Returns { score, index }.
 */
export function maxSimilarity(
  text: string,
  corpus: string[],
): { score: number; index: number } {
  let best = 0;
  let index = -1;
  for (let i = 0; i < corpus.length; i++) {
    const score = Math.max(jaccard(text, corpus[i]), shingleSimilarity(text, corpus[i]));
    if (score > best) {
      best = score;
      index = i;
    }
  }
  return { score: best, index };
}
