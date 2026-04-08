/**
 * useSuggestions
 * Fires on every keystroke (100ms debounce, min 1 char) and returns
 * up to 6 deduplicated autocomplete suggestions drawn from song titles
 * and artist names. Results are cached in memory for the session.
 *
 * Abort-controller pattern ensures only the latest request resolves —
 * stale in-flight requests are cancelled before a new one fires.
 */

import { supabase } from "@/lib/supabase";
import { Suggestion } from "@/types/search";
import { useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 100;
const MIN_LEN = 1;
const MAX_SUGGESTIONS = 6;

// Session-level cache: query string → suggestions array
const cache = new Map<string, Suggestion[]>();

export function useSuggestions(query: string): {
  suggestions: Suggestion[];
  loading: boolean;
} {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear timer
    if (timerRef.current) clearTimeout(timerRef.current);
    // Abort any in-flight request
    abortRef.current?.abort();

    const q = query.trim();

    if (q.length < MIN_LEN) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Cache hit — instant, no loading state
    const cacheKey = q.toLowerCase();
    if (cache.has(cacheKey)) {
      setSuggestions(cache.get(cacheKey)!);
      return;
    }

    setLoading(true);

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Fire both queries in parallel
        const [songsRes, artistsRes] = await Promise.all([
          supabase
            .from("songs")
            .select("id, title")
            .ilike("title", `${q}%`) // starts-with is faster than contains
            .eq("is_active", true)
            .limit(8),

          supabase
            .from("artists")
            .select("id, name")
            .ilike("name", `${q}%`)
            .eq("is_active", true)
            .limit(5),
        ]);

        // Bail if this request was superseded
        if (controller.signal.aborted) return;

        const seen = new Set<string>();
        const results: Suggestion[] = [];

        // Artists first — shorter names, more likely to be what user wants
        for (const a of artistsRes.data ?? []) {
          const key = a.name.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              id: `artist-${a.id}`,
              text: a.name,
              source: "artist",
            });
          }
        }

        // Then song titles
        for (const s of songsRes.data ?? []) {
          const key = s.title.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            results.push({ id: `song-${s.id}`, text: s.title, source: "song" });
          }
        }

        const final = results.slice(0, MAX_SUGGESTIONS);
        cache.set(cacheKey, final);
        setSuggestions(final);
      } catch {
        // Aborted or network error — silently ignore
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [query]);

  return { suggestions, loading };
}
