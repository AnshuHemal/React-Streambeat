/**
 * lyrics.ts
 * Service layer for fetching and saving song lyrics.
 *
 * Priority order when fetching:
 *   1. songs.lyrics column in Supabase (admin-provided, always wins)
 *   2. LRCLIB public API (free, no key required)
 *   3. null — caller shows "No lyrics available"
 */

import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LyricsResult = {
  lrc: string | null;
  /** Where the lyrics came from — useful for debugging */
  source: "database" | "lrclib" | "none";
};

// ─── Fetch from DB ────────────────────────────────────────────────────────────

/**
 * Fetches the raw LRC string stored in songs.lyrics.
 * Returns null if the column is empty or the row doesn't exist.
 */
export async function fetchLyricsFromDb(
  songId: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("songs")
      .select("lyrics")
      .eq("id", songId)
      .single();

    if (error || !data?.lyrics) return null;
    return data.lyrics as string;
  } catch {
    return null;
  }
}

// ─── Fetch from LRCLIB ───────────────────────────────────────────────────────

type LrclibResponse = {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
};

/**
 * Queries the free LRCLIB API for synced lyrics.
 * Falls back to plain lyrics if synced aren't available.
 * Returns null on any error or if no match found.
 */
export async function fetchLyricsFromLrclib(params: {
  trackName: string;
  artistName: string;
  albumName?: string;
  durationSec?: number;
}): Promise<string | null> {
  try {
    const url = new URL("https://lrclib.net/api/get");
    url.searchParams.set("track_name", params.trackName);
    url.searchParams.set("artist_name", params.artistName);
    if (params.albumName) url.searchParams.set("album_name", params.albumName);
    if (params.durationSec != null)
      url.searchParams.set("duration", String(Math.round(params.durationSec)));

    const res = await fetch(url.toString(), {
      headers: { "Lrclib-Client": "Streambeat/1.0" },
    });

    if (!res.ok) return null;

    const json: LrclibResponse = await res.json();
    // Prefer synced (timestamped) lyrics
    return json.syncedLyrics || json.plainLyrics || null;
  } catch {
    return null;
  }
}

// ─── Combined fetch ───────────────────────────────────────────────────────────

/**
 * Main entry point used by the player.
 * Checks DB first, then falls back to LRCLIB.
 */
export async function fetchLyrics(params: {
  songId: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  durationMs?: number;
}): Promise<LyricsResult> {
  // 1. DB
  const dbLyrics = await fetchLyricsFromDb(params.songId);
  if (dbLyrics) return { lrc: dbLyrics, source: "database" };

  // 2. LRCLIB
  const lrclibLyrics = await fetchLyricsFromLrclib({
    trackName: params.trackName,
    artistName: params.artistName,
    albumName: params.albumName,
    durationSec: params.durationMs ? params.durationMs / 1000 : undefined,
  });
  if (lrclibLyrics) return { lrc: lrclibLyrics, source: "lrclib" };

  return { lrc: null, source: "none" };
}

// ─── Save to DB ───────────────────────────────────────────────────────────────

/**
 * Saves raw LRC text to songs.lyrics.
 * Pass null to clear lyrics.
 */
export async function saveLyrics(
  songId: string,
  lrc: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("songs")
    .update({ lyrics: lrc ?? null })
    .eq("id", songId);

  if (error) throw new Error(`Failed to save lyrics: ${error.message}`);
}
