/**
 * useTrendingSearches
 *
 * Fetches trending search queries from the trending_searches table.
 * Results are cached for the session — no need to refetch on every focus.
 *
 * Schema expected in Supabase:
 *
 *   trending_searches (
 *     id         uuid primary key default gen_random_uuid(),
 *     query      text not null unique,
 *     rank       int  not null default 0,   -- lower = higher trending
 *     is_active  bool not null default true,
 *     updated_at timestamptz not null default now()
 *   )
 */

import { supabase } from "@/lib/supabase";
import { TrendingSearch } from "@/types/search";
import { useEffect, useState } from "react";

// Session-level cache — fetched once per app launch
let cachedTrending: TrendingSearch[] | null = null;

export function useTrendingSearches() {
  const [trending, setTrending] = useState<TrendingSearch[]>(
    cachedTrending ?? [],
  );
  const [loading, setLoading] = useState(cachedTrending === null);

  useEffect(() => {
    if (cachedTrending !== null) {
      setTrending(cachedTrending);
      setLoading(false);
      return;
    }

    supabase
      .from("trending_searches")
      .select("id, query, rank")
      .eq("is_active", true)
      .order("rank", { ascending: true })
      .limit(8)
      .then(({ data }) => {
        const results: TrendingSearch[] = (data ?? []).map((row: any) => ({
          id: row.id,
          query: row.query,
          rank: row.rank,
        }));
        cachedTrending = results;
        setTrending(results);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { trending, loading };
}
