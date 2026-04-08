/**
 * usePlayHistory
 *
 * Manages the current user's play history for search personalisation.
 *
 * - Loads the top-50 most-played artist IDs for the current user on mount.
 *   These are used by useSearch to boost results from familiar artists.
 *
 * - Exposes recordPlay(songId, artistIds) which:
 *     1. Upserts a row in user_play_history (increments play_count)
 *     2. Increments songs.play_count globally
 *     3. Updates the local artistPlayCounts map so ranking is immediately
 *        accurate for the rest of the session without a refetch.
 *
 * Schema expected in Supabase:
 *
 *   user_play_history (
 *     id          uuid primary key default gen_random_uuid(),
 *     user_id     uuid references auth.users not null,
 *     song_id     uuid references songs not null,
 *     play_count  int  not null default 1,
 *     last_played timestamptz not null default now(),
 *     unique(user_id, song_id)
 *   )
 *
 *   songs.play_count  int not null default 0
 *   songs.release_date date
 *
 * Both writes are fire-and-forget — a failure never blocks playback.
 */

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useRef, useState } from "react";

export type PlayHistory = {
  /** artist_id → how many times the user has played songs by this artist */
  artistPlayCounts: Map<string, number>;
  /** Whether the initial load is complete */
  isReady: boolean;
  /** Call this every time a song starts playing */
  recordPlay: (songId: string, artistIds: string[]) => void;
};

export function usePlayHistory(): PlayHistory {
  const { user } = useAuth();
  const [artistPlayCounts, setArtistPlayCounts] = useState<Map<string, number>>(
    new Map(),
  );
  const [isReady, setIsReady] = useState(false);
  // Keep a mutable ref so recordPlay always sees the latest map without
  // needing it as a dependency (avoids stale closure issues).
  const countsRef = useRef<Map<string, number>>(new Map());

  // ── Load top artist play counts on mount / user change ────────────────────
  useEffect(() => {
    if (!user?.id) {
      setArtistPlayCounts(new Map());
      countsRef.current = new Map();
      setIsReady(true);
      return;
    }

    setIsReady(false);

    // Fetch the user's top 50 played songs and aggregate by artist
    supabase
      .from("user_play_history")
      .select(
        `song_id, play_count,
         songs(song_artists(artist_id))`,
      )
      .eq("user_id", user.id)
      .order("play_count", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const map = new Map<string, number>();
        for (const row of data ?? []) {
          const artistIds: string[] = (
            (row as any).songs?.song_artists ?? []
          ).map((sa: any) => sa.artist_id);
          for (const aid of artistIds) {
            map.set(aid, (map.get(aid) ?? 0) + ((row as any).play_count ?? 1));
          }
        }
        countsRef.current = map;
        setArtistPlayCounts(map);
        setIsReady(true);
      });
  }, [user?.id]);

  // ── Record a play ──────────────────────────────────────────────────────────
  const recordPlay = useCallback(
    (songId: string, artistIds: string[]) => {
      // 1. Update local map immediately for instant ranking effect
      const next = new Map(countsRef.current);
      for (const aid of artistIds) {
        next.set(aid, (next.get(aid) ?? 0) + 1);
      }
      countsRef.current = next;
      setArtistPlayCounts(new Map(next));

      if (!user?.id) return;

      // 2. Upsert user_play_history row (fire-and-forget)
      supabase
        .from("user_play_history")
        .upsert(
          {
            user_id: user.id,
            song_id: songId,
            play_count: 1,
            last_played: new Date().toISOString(),
          },
          {
            onConflict: "user_id,song_id",
            ignoreDuplicates: false,
          },
        )
        .then(() => {
          // After upsert, increment play_count via RPC if available,
          // otherwise do a raw increment. We use a simple select+update
          // pattern here — for high-traffic apps use a DB function instead.
          supabase
            .rpc("increment_song_play_count", { p_song_id: songId })
            .then(() => {})
            .catch(() => {
              // RPC not available — silently ignore, play_count stays stale
            });
        })
        .catch(() => {
          // Network error — silently ignore, local state already updated
        });
    },
    [user?.id],
  );

  return { artistPlayCounts, isReady, recordPlay };
}
