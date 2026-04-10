/**
 * searchRanker.ts
 *
 * Pure ranking engine for search results. Produces a composite score for
 * each result and sorts ascending (lower score = better rank).
 *
 * Score components (all normalised to [0, 1] before weighting):
 *
 *   matchScore       — how well the title/name matches the query
 *   popularityScore  — global play_count (songs only)
 *   personalScore    — how often the user has played this artist
 *   recencyScore     — how recently the song/album was released
 *
 *   match       40%  — relevance is still king
 *   popularity  25%  — popular songs surface naturally
 *   personal    25%  — personalisation is a strong signal
 *   recency     10%  — slight nudge for new releases
 *
 * For artists and albums, popularity and recency signals are absent so
 * their weights are redistributed to match + personal.
 */

import { SearchResultItem } from "@/types/search";

// ─── Weights ──────────────────────────────────────────────────────────────────

const W = {
  song: { match: 0.4, popularity: 0.25, personal: 0.25, recency: 0.1 },
  artist: { match: 0.55, popularity: 0.0, personal: 0.45, recency: 0.0 },
  album: { match: 0.5, popularity: 0.0, personal: 0.35, recency: 0.15 },
} as const;

// ─── Match score ──────────────────────────────────────────────────────────────

/**
 * Returns a [0, 1] score where 0 = perfect match, 1 = weakest match.
 * Tiers:
 *   exact full match          → 0.00
 *   starts with query         → 0.20
 *   word boundary starts with → 0.40
 *   contains query            → 0.70
 *   no match (shouldn't happen but safe) → 1.00
 */
function matchScore(title: string, q: string): number {
  const t = title.toLowerCase();
  if (t === q) return 0.0;
  if (t.startsWith(q)) return 0.2;
  if (t.split(/\s+/).some((w) => w.startsWith(q))) return 0.4;
  if (t.includes(q)) return 0.7;
  return 1.0;
}

// ─── Popularity score ─────────────────────────────────────────────────────────

/**
 * Normalises play_count to [0, 1] using a log scale so the difference
 * between 1M and 10M plays doesn't completely dominate over 100k plays.
 * Returns 0 for the most popular (best rank), 1 for zero plays.
 */
function popularityScore(playCount: number): number {
  if (playCount <= 0) return 1.0;
  // log10(1) = 0, log10(10M) ≈ 7 — cap at 8 to handle outliers
  const normalised = Math.min(Math.log10(playCount) / 8, 1);
  return 1 - normalised; // invert: higher plays → lower (better) score
}

// ─── Personalisation score ────────────────────────────────────────────────────

/**
 * Looks up how many times the user has played songs by each artist in this
 * result. Returns 0 (best) if the user has played them a lot, 1 if never.
 */
function personalScore(
  artistIds: string[],
  artistPlayCounts: Map<string, number>,
): number {
  if (artistIds.length === 0) return 1.0;
  const total = artistIds.reduce(
    (sum, id) => sum + (artistPlayCounts.get(id) ?? 0),
    0,
  );
  if (total === 0) return 1.0;
  // Cap at 100 plays for normalisation — beyond that it's all "very familiar"
  const normalised = Math.min(total / 100, 1);
  return 1 - normalised;
}

// ─── Recency score ────────────────────────────────────────────────────────────

/**
 * Boosts results released in the last 2 years.
 * Returns 0 (best) for today, 1 for anything older than 2 years.
 */
function recencyScore(releaseDate: string | null): number {
  if (!releaseDate) return 0.5; // unknown — neutral
  const ageMs = Date.now() - new Date(releaseDate).getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365);
  return Math.min(ageYears / 2, 1); // 0 = just released, 1 = 2+ years old
}

// ─── Composite scorer ─────────────────────────────────────────────────────────

function compositeScore(
  item: SearchResultItem,
  q: string,
  artistPlayCounts: Map<string, number>,
): number {
  if (item.kind === "song") {
    const w = W.song;
    const artistIds = item.data.artists.map((a) => a.id);
    return (
      w.match * matchScore(item.data.title, q) +
      w.popularity * popularityScore(item.data.play_count ?? 0) +
      w.personal * personalScore(artistIds, artistPlayCounts) +
      w.recency * recencyScore(item.data.release_date ?? null)
    );
  }

  if (item.kind === "artist") {
    const w = W.artist;
    return (
      w.match * matchScore(item.data.name, q) +
      w.personal * personalScore([item.data.id], artistPlayCounts)
    );
  }

  // album
  const w = W.album;
  const artistIds = item.data.artist.id ? [item.data.artist.id] : [];
  return (
    w.match * matchScore(item.data.title, q) +
    w.personal * personalScore(artistIds, artistPlayCounts) +
    w.recency * recencyScore(item.data.release_date ?? null)
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Ranks search results using the composite scoring model.
 * Priority tiers (song/artist/album) are preserved — ranking only reorders
 * items within the same tier.
 */
export function rankSearchResults(
  items: SearchResultItem[],
  query: string,
  artistPlayCounts: Map<string, number>,
): SearchResultItem[] {
  const q = query.trim().toLowerCase();

  // Attach scores
  const scored = items.map((item) => ({
    item,
    score: compositeScore(item, q, artistPlayCounts),
  }));

  // Sort: priority tier first, then composite score within tier
  scored.sort((a, b) => {
    if (a.item.priority !== b.item.priority)
      return a.item.priority - b.item.priority;
    return a.score - b.score;
  });

  return scored.map((s) => s.item);
}
