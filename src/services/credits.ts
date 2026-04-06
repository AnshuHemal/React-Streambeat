/**
 * credits.ts
 * Service layer for song_credits + song_sources table operations.
 */

import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreditRole =
  | "Main Artist"
  | "Featured Artist"
  | "Author"
  | "Composer"
  | "Lyricist"
  | "Producer"
  | "Executive Producer"
  | "Mixing Engineer"
  | "Mastering Engineer"
  | "Engineer"
  | "Label"
  | "Publisher";

export const CREDIT_ROLES: CreditRole[] = [
  "Main Artist",
  "Featured Artist",
  "Author",
  "Composer",
  "Lyricist",
  "Producer",
  "Executive Producer",
  "Mixing Engineer",
  "Mastering Engineer",
  "Engineer",
  "Label",
  "Publisher",
];

/** Maps each role to the display section it belongs to */
export const ROLE_TO_SECTION: Record<CreditRole, string> = {
  "Main Artist": "Artist",
  "Featured Artist": "Artist",
  Author: "Composition & Lyrics",
  Composer: "Composition & Lyrics",
  Lyricist: "Composition & Lyrics",
  Producer: "Production & Engineering",
  "Executive Producer": "Production & Engineering",
  "Mixing Engineer": "Production & Engineering",
  "Mastering Engineer": "Production & Engineering",
  Engineer: "Production & Engineering",
  Label: "Sources",
  Publisher: "Sources",
};

export const SECTION_ORDER = [
  "Artist",
  "Composition & Lyrics",
  "Production & Engineering",
  "Sources",
] as const;

// ─── DB row types ─────────────────────────────────────────────────────────────

/** A single credit row as stored in song_credits */
export type SongCredit = {
  id?: string;
  song_id: string;
  artist_id: string;
  roles: string; // comma-separated, e.g. "Main Artist,Author"
  credit_order: number;
};

/** A single source row as stored in song_sources */
export type SongSource = {
  id?: string;
  song_id: string;
  name: string; // e.g. "EYP Creations"
  source_order: number;
};

// ─── Admin form types ─────────────────────────────────────────────────────────

/** Shape used in the admin form for artist credits — no song_id yet */
export type CreditDraft = {
  key: string; // temp React key
  artist_id: string;
  artist_name: string; // display only
  roles: CreditRole[];
  credit_order: number;
};

/** Shape used in the admin form for sources */
export type SourceDraft = {
  key: string;
  name: string;
};

// ─── Player display type ──────────────────────────────────────────────────────

/** Shape returned to the player — matches CreditEntry in CreditsCard */
export type ResolvedCredit = {
  artistId: string;
  name: string;
  /** Bullet-separated roles, e.g. "Main Artist • Author" */
  roles: string;
};

/** Full credits payload for the player */
export type SongCreditsPayload = {
  credits: ResolvedCredit[];
  sources: string[]; // plain name strings
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * Fetches credits + sources for a song.
 * Returns empty arrays if tables don't exist yet.
 */
export async function fetchSongCredits(
  songId: string,
): Promise<SongCreditsPayload> {
  try {
    const [creditsRes, sourcesRes] = await Promise.all([
      supabase
        .from("song_credits")
        .select("artist_id, roles, credit_order, artists(id, name)")
        .eq("song_id", songId)
        .order("credit_order"),
      supabase
        .from("song_sources")
        .select("name, source_order")
        .eq("song_id", songId)
        .order("source_order"),
    ]);

    const credits: ResolvedCredit[] = (creditsRes.data ?? []).map(
      (row: any) => ({
        artistId: row.artist_id,
        name: row.artists?.name ?? "Unknown",
        // DB stores comma-separated → display as bullet-separated
        roles: (row.roles ?? "")
          .split(",")
          .map((r: string) => r.trim())
          .filter(Boolean)
          .join(" • "),
      }),
    );

    const sources: string[] = (sourcesRes.data ?? []).map(
      (row: any) => row.name as string,
    );

    return { credits, sources };
  } catch {
    return { credits: [], sources: [] };
  }
}

// ─── Save ─────────────────────────────────────────────────────────────────────

/**
 * Replaces all credits + sources for a song (delete + insert).
 * Call this after inserting/updating the song row.
 */
export async function saveSongCredits(
  songId: string,
  drafts: CreditDraft[],
  sourceDrafts: SourceDraft[],
): Promise<void> {
  // ── Credits ──
  const { error: delCreditsErr } = await supabase
    .from("song_credits")
    .delete()
    .eq("song_id", songId);

  if (delCreditsErr) {
    throw new Error(`Failed to clear credits: ${delCreditsErr.message}`);
  }

  if (drafts.length > 0) {
    const creditRows: SongCredit[] = drafts.map((d, i) => ({
      song_id: songId,
      artist_id: d.artist_id,
      roles: d.roles.join(","),
      credit_order: i,
    }));

    const { error: insCreditsErr } = await supabase
      .from("song_credits")
      .insert(creditRows);

    if (insCreditsErr) {
      throw new Error(`Failed to save credits: ${insCreditsErr.message}`);
    }
  }

  // ── Sources ──
  const { error: delSourcesErr } = await supabase
    .from("song_sources")
    .delete()
    .eq("song_id", songId);

  if (delSourcesErr) {
    throw new Error(`Failed to clear sources: ${delSourcesErr.message}`);
  }

  if (sourceDrafts.length > 0) {
    const sourceRows: SongSource[] = sourceDrafts
      .filter((s) => s.name.trim())
      .map((s, i) => ({
        song_id: songId,
        name: s.name.trim(),
        source_order: i,
      }));

    if (sourceRows.length > 0) {
      const { error: insSourcesErr } = await supabase
        .from("song_sources")
        .insert(sourceRows);

      if (insSourcesErr) {
        throw new Error(`Failed to save sources: ${insSourcesErr.message}`);
      }
    }
  }
}

// ─── Load for edit ────────────────────────────────────────────────────────────

/** Loads credits + sources back into draft form for editing */
export async function loadCreditsForEdit(songId: string): Promise<{
  credits: CreditDraft[];
  sources: SourceDraft[];
}> {
  try {
    const [creditsRes, sourcesRes] = await Promise.all([
      supabase
        .from("song_credits")
        .select("artist_id, roles, credit_order, artists(id, name)")
        .eq("song_id", songId)
        .order("credit_order"),
      supabase
        .from("song_sources")
        .select("name, source_order")
        .eq("song_id", songId)
        .order("source_order"),
    ]);

    const credits: CreditDraft[] = (creditsRes.data ?? []).map(
      (row: any, i: number) => ({
        key: `${row.artist_id}-${i}`,
        artist_id: row.artist_id,
        artist_name: row.artists?.name ?? "Unknown",
        roles: (row.roles ?? "")
          .split(",")
          .map((r: string) => r.trim())
          .filter(Boolean) as CreditRole[],
        credit_order: row.credit_order ?? i,
      }),
    );

    const sources: SourceDraft[] = (sourcesRes.data ?? []).map(
      (row: any, i: number) => ({
        key: `source-${i}`,
        name: row.name ?? "",
      }),
    );

    return { credits, sources };
  } catch {
    return { credits: [], sources: [] };
  }
}
