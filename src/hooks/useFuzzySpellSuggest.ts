/**
 * useFuzzySpellSuggest
 *
 * When a search returns zero results, this hook tries to find a "Did you
 * mean...?" suggestion using client-side trigram similarity.
 *
 * Strategy:
 *   1. Fetch a small pool of popular song titles + artist names from Supabase
 *      (ordered by play_count desc, limit 200) — cached for the session.
 *   2. Run findClosestMatch() against the pool using trigram similarity.
 *   3. Return the best match if its similarity score exceeds the threshold.
 *
 * This runs only when results are empty and the query is committed, so it
 * never fires during active typing.
 */

import { supabase } from "@/lib/supabase";
import { findClosestMatch } from "@/lib/trigram";
import { useEffect, useRef, useState } from "react";

// Session-level candidate pool — fetched once per app launch
let candidatePool: string[] | null = null;
let poolFetchPromise: Promise<string[]> | null = null;

async function getCandidatePool(): Promise<string[]> {
  if (candidatePool !== null) return candidatePool;
  if (poolFetchPromise) return poolFetchPromise;

  poolFetchPromise = Promise.allSettled([
    supabase
      .from("songs")
      .select("title")
      .eq("is_active", true)
      .order("play_count", { ascending: false })
      .limit(150),

    supabase.from("artists").select("name").eq("is_active", true).limit(100),
  ]).then(([songsRes, artistsRes]) => {
    const songs =
      songsRes.status === "fulfilled"
        ? (songsRes.value.data ?? []).map((r: any) => r.title as string)
        : [];
    const artists =
      artistsRes.status === "fulfilled"
        ? (artistsRes.value.data ?? []).map((r: any) => r.name as string)
        : [];

    const pool = [...new Set([...songs, ...artists])];
    candidatePool = pool;
    return pool;
  });

  return poolFetchPromise;
}

export function useFuzzySpellSuggest(
  query: string,
  hasResults: boolean,
): { suggestion: string | null } {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const lastQueryRef = useRef("");

  useEffect(() => {
    const q = query.trim();

    // Only run when there are no results and query is meaningful
    if (hasResults || q.length < 3) {
      setSuggestion(null);
      return;
    }

    // Don't re-run for the same query
    if (q === lastQueryRef.current) return;
    lastQueryRef.current = q;

    getCandidatePool().then((pool) => {
      // Guard: if query changed while we were fetching, bail
      if (q !== lastQueryRef.current) return;

      const match = findClosestMatch(q, pool, 0.2);
      // Don't suggest the exact same string
      setSuggestion(
        match && match.toLowerCase() !== q.toLowerCase() ? match : null,
      );
    });
  }, [query, hasResults]);

  return { suggestion };
}
