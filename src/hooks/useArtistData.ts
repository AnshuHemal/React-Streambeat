/**
 * useArtistData
 *
 * Fetches all data for the artist screen in parallel:
 *   - Artist profile (name, image, description, monthly_listeners, genres)
 *   - Popular songs (via song_artists junction, sorted by play_count)
 *   - Releases (albums/singles/EPs, sorted by release_date desc)
 *   - Fans Also Like — three-tier strategy:
 *       1. Pre-computed artist_similarities table (fastest, most accurate)
 *       2. Play-history RPC: users who played this artist ≥3 times → co-played artists
 *       3. Genre similarity fallback (for artists with no play history yet)
 */

import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ArtistProfile = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  monthly_listeners: number | null;
  description: string | null;
  genres: string[];
};

export type ArtistSong = {
  id: string;
  title: string;
  image_url: string | null;
  audio_url: string | null;
  preview_url: string | null;
  duration_ms: number | null;
  play_count: number | null;
  artist_name: string;
  artists: { id: string; name: string; image_url: string | null }[];
  album_title: string | null;
};

export type ArtistRelease = {
  id: string;
  title: string;
  album_type: string | null;
  image_url: string | null;
  release_date: string | null;
  isLatest: boolean;
};

export type FanLikeArtist = {
  id: string;
  name: string;
  image_url: string | null;
};

export type ArtistData = {
  artist: ArtistProfile | null;
  songs: ArtistSong[];
  releases: ArtistRelease[];
  fansAlsoLike: FanLikeArtist[];
  loading: boolean;
  error: string | null;
};

// ─── Fans Also Like — three-tier strategy ─────────────────────────────────────

async function fetchFansAlsoLike(artistId: string): Promise<FanLikeArtist[]> {
  // Tier 1: pre-computed similarity table (nightly batch job populates this)
  const { data: precomputed } = await supabase
    .from("artist_similarities")
    .select("artist_id_b, score")
    .eq("artist_id_a", artistId)
    .order("score", { ascending: false })
    .limit(6);

  if (precomputed && precomputed.length >= 3) {
    const ids = precomputed.map((r: any) => r.artist_id_b);
    const { data: artists } = await supabase
      .from("artists")
      .select("id, name, image_url")
      .in("id", ids)
      .eq("is_active", true);

    if (artists && artists.length >= 3) {
      const map = new Map((artists as any[]).map((a) => [a.id, a]));
      return ids.map((id) => map.get(id)).filter(Boolean) as FanLikeArtist[];
    }
  }

  // Tier 2: play-history RPC — users who played this artist ≥3 times
  const { data: playBased } = await supabase.rpc("get_fans_also_like", {
    p_artist_id: artistId,
    p_limit: 6,
  });

  if (playBased && playBased.length >= 3) {
    const ids = (playBased as any[]).map((r) => r.artist_id);
    const { data: artists } = await supabase
      .from("artists")
      .select("id, name, image_url")
      .in("id", ids)
      .eq("is_active", true);

    if (artists && artists.length >= 3) {
      const map = new Map((artists as any[]).map((a) => [a.id, a]));
      return ids.map((id) => map.get(id)).filter(Boolean) as FanLikeArtist[];
    }
  }

  // Tier 3: genre similarity fallback
  const { data: genreBased } = await supabase.rpc("get_similar_by_genre", {
    p_artist_id: artistId,
    p_limit: 6,
  });

  if (genreBased && genreBased.length > 0) {
    const ids = (genreBased as any[]).map((r) => r.artist_id);
    const { data: artists } = await supabase
      .from("artists")
      .select("id, name, image_url")
      .in("id", ids)
      .eq("is_active", true);

    if (artists && artists.length > 0) {
      const map = new Map((artists as any[]).map((a) => [a.id, a]));
      return ids.map((id) => map.get(id)).filter(Boolean) as FanLikeArtist[];
    }
  }

  // Final fallback: co-preference from profiles (original approach, last resort)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("artist_preferences")
    .contains("artist_preferences", [artistId])
    .limit(100);

  if (!profiles || profiles.length === 0) return [];

  const counts = new Map<string, number>();
  for (const p of profiles) {
    for (const id of p.artist_preferences ?? []) {
      if (id !== artistId) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return [];

  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id);

  const { data: artists } = await supabase
    .from("artists")
    .select("id, name, image_url")
    .in("id", topIds)
    .eq("is_active", true);

  const map = new Map((artists ?? []).map((a: any) => [a.id, a]));
  return topIds.map((id) => map.get(id)).filter(Boolean) as FanLikeArtist[];
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useArtistData(artistId: string | undefined): ArtistData {
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [songs, setSongs] = useState<ArtistSong[]>([]);
  const [releases, setReleases] = useState<ArtistRelease[]>([]);
  const [fansAlsoLike, setFansAlsoLike] = useState<FanLikeArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!artistId) {
      setLoading(false);
      return;
    }

    abortRef.current = false;
    setLoading(true);
    setError(null);

    const run = async () => {
      const [artistRes, songsRes, releasesRes, fansRes] =
        await Promise.allSettled([
          // ── Artist profile (guaranteed columns only) ────────────────────────
          supabase
            .from("artists")
            .select("id, name, slug, image_url")
            .eq("id", artistId)
            .single(),

          // ── Songs via junction ──────────────────────────────────────────────
          supabase
            .from("song_artists")
            .select(
              `songs(
                id, title, image_url, audio_url, preview_url, duration_ms, play_count,
                album:albums(title),
                song_artists(artists(id, name, image_url))
              )`,
            )
            .eq("artist_id", artistId)
            .limit(10),

          // ── Releases ────────────────────────────────────────────────────────
          supabase
            .from("album_artists")
            .select("albums(id, title, album_type, image_url, release_date)")
            .eq("artist_id", artistId)
            .limit(20),

          // ── Fans Also Like ──────────────────────────────────────────────────
          fetchFansAlsoLike(artistId),
        ]);

      if (abortRef.current) return;

      // ── Artist ──────────────────────────────────────────────────────────────
      if (artistRes.status === "fulfilled" && artistRes.value.data) {
        const d = artistRes.value.data as any;

        // Optional columns — fetched separately so missing columns don't break load
        let description: string | null = null;
        let monthly_listeners: number | null = null;
        let genres: string[] = [];
        try {
          const { data: ext } = await supabase
            .from("artists")
            .select("description, monthly_listeners, genres")
            .eq("id", artistId)
            .single();
          description = ext?.description ?? null;
          monthly_listeners = ext?.monthly_listeners ?? null;
          genres = ext?.genres ?? [];
        } catch {
          // columns don't exist yet — ignore
        }

        setArtist({
          id: d.id,
          name: d.name,
          slug: d.slug,
          image_url: d.image_url ?? null,
          monthly_listeners,
          description,
          genres,
        });
      } else {
        setError("Artist not found");
        setLoading(false);
        return;
      }

      // ── Songs ────────────────────────────────────────────────────────────────
      if (songsRes.status === "fulfilled" && songsRes.value.data) {
        const raw = songsRes.value.data as any[];
        const mapped: ArtistSong[] = raw
          .map((row) => {
            const s = row.songs;
            if (!s) return null;
            const artistList = (s.song_artists ?? [])
              .map((sa: any) => sa.artists)
              .filter(Boolean)
              .flat();
            return {
              id: s.id,
              title: s.title,
              image_url: s.image_url ?? null,
              audio_url: s.audio_url ?? null,
              preview_url: s.preview_url ?? null,
              duration_ms: s.duration_ms ?? null,
              play_count: s.play_count ?? null,
              artist_name:
                artistList.map((a: any) => a.name).join(", ") ||
                "Unknown Artist",
              artists: artistList.map((a: any) => ({
                id: a.id,
                name: a.name,
                image_url: a.image_url ?? null,
              })),
              album_title: s.album?.title ?? null,
            } as ArtistSong;
          })
          .filter(Boolean) as ArtistSong[];

        mapped.sort((a, b) => (b.play_count ?? 0) - (a.play_count ?? 0));
        setSongs(mapped);
      }

      // ── Releases ─────────────────────────────────────────────────────────────
      if (releasesRes.status === "fulfilled" && releasesRes.value.data) {
        const raw = releasesRes.value.data as any[];
        const seen = new Set<string>();
        const mapped: ArtistRelease[] = [];

        for (const row of raw) {
          const a = row.albums;
          if (!a || seen.has(a.id)) continue;
          seen.add(a.id);
          mapped.push({
            id: a.id,
            title: a.title,
            album_type: a.album_type ?? null,
            image_url: a.image_url ?? null,
            release_date: a.release_date ?? null,
            isLatest: false,
          });
        }

        mapped.sort((a, b) => {
          if (!a.release_date) return 1;
          if (!b.release_date) return -1;
          return (
            new Date(b.release_date).getTime() -
            new Date(a.release_date).getTime()
          );
        });
        if (mapped.length > 0) mapped[0].isLatest = true;
        setReleases(mapped);
      }

      // ── Fans Also Like ────────────────────────────────────────────────────────
      if (fansRes.status === "fulfilled") {
        setFansAlsoLike(fansRes.value);
      }

      setLoading(false);
    };

    run().catch(() => {
      if (!abortRef.current) {
        setError("Failed to load artist");
        setLoading(false);
      }
    });

    return () => {
      abortRef.current = true;
    };
  }, [artistId]);

  return { artist, songs, releases, fansAlsoLike, loading, error };
}
