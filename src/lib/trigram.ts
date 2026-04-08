/**
 * trigram.ts
 *
 * Client-side trigram similarity — mirrors what pg_trgm does in Postgres.
 *
 * A trigram is a set of 3 consecutive characters. Similarity between two
 * strings is the Jaccard coefficient of their trigram sets:
 *
 *   similarity = |A ∩ B| / |A ∪ B|
 *
 * Returns a value in [0, 1] where 1 = identical.
 */

function buildTrigrams(s: string): Set<string> {
  // Pad with spaces like pg_trgm does: "  word  " → trigrams include boundary chars
  const padded = `  ${s.toLowerCase()}  `;
  const grams = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) {
    grams.add(padded.slice(i, i + 3));
  }
  return grams;
}

export function trigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const ga = buildTrigrams(a);
  const gb = buildTrigrams(b);

  let intersection = 0;
  for (const g of ga) {
    if (gb.has(g)) intersection++;
  }

  const union = ga.size + gb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Given a query and a list of candidate strings, returns the candidate
 * with the highest trigram similarity above the threshold, or null if
 * none exceed it.
 */
export function findClosestMatch(
  query: string,
  candidates: string[],
  threshold = 0.2,
): string | null {
  let best: string | null = null;
  let bestScore = threshold;

  for (const candidate of candidates) {
    const score = trigramSimilarity(query, candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}
