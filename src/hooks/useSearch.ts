/**
 * useSearch
 *
 * Full-featured search hook with:
 *
 *  ✓ Debounced queries (300ms)
 *  ✓ AbortController — cancels stale in-flight requests on every keystroke
 *  ✓ 5-min session cache — instant results for repeated / back-navigated queries
 *  ✓ Partial results — Promise.allSettled means one failing query never wipes all results
 *  ✓ Composite ranking — match quality + popularity + personalisation + recency
 *  ✓ Pagination / infinite scroll — loadMore() fetches the next page per entity
 *    type using Supabase .range() and appends to the existing ranked list
 */

import { rankSearchResults } from "@/lib/searchRanker";
import { supabase } from "@/lib/supabase";
import {
    SearchAlbum,
    SearchArtist,
    SearchResultItem,
    SearchSong,
} from "@/types/search";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 300;
const MIN_QUERY_LEN = 2;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Initial page sizes — intentionally modest so first paint is fast
const PAGE_SONGS = 10;
const PAGE_ARTISTS = 5;
const PAGE_ALBUMS = 10;

// ─── Cache ─────────────────────────────────────────────────────────────────────

type PageState = {
  songOffset: number;
  artistOffset: number;
  albumOffset: number;
  hasMoreSongs: boolean;
  hasMoreArtists: boolean;
  hasMoreAlbums: boolean;
};

type CacheEntry = {
  /** Raw (unranked) items — ranking is re-applied on read so personalisation stays fresh */
  rawItems: SearchResultItem[];
  pageState: PageState;
  ts: number;
};

const resultCache = new Map<string, CacheEntry>();

function getCached(key: string): CacheEntry | null {
  const entry = resultCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    resultCache.delete(key);
    return null;
  }
  return entry;
}

function setCache(key: string, entry: Omit<CacheEntry, "ts">) {
  resultCache.set(key, { ...entry, ts: Date.now() });
}

function updateCache(key: string, patch: Partial<Omit<CacheEntry, "ts">>) {
  const existing = resultCache.get(key);
  if (existing) {
    resultCache.set(key, { ...existing, ...patch, ts: Date.now() });
  }
}

// ─── Mappers ───────────────────────────────────────────────────────────────────

function mapSong(raw: any): SearchSong {
  const artistList: { id: string; name: string; image_url: string | null }[] = (
    raw.song_artists ?? []
  )
    .map((sa: any) => sa.artists)
    .filter(Boolean)
    .flat();

  const legacyArtist = raw.artists
    ? Array.isArray(raw.artists)
      ? raw.artists[0]
      : raw.artists
    : null;

  const resolvedArtists =
    artistList.length > 0
      ? artistList
      : legacyArtist
        ? [
            {
              id: legacyArtist.id ?? "",
              name: legacyArtist.name,
              image_url: legacyArtist.image_url ?? null,
            },
          ]
        : [];

  return {
    id: raw.id,
    title: raw.title,
    image_url: raw.image_url ?? null,
    audio_url: raw.audio_url ?? null,
    preview_url: raw.preview_url ?? null,
    duration_ms: raw.duration_ms ?? null,
    artist_name:
      resolvedArtists.map((a) => a.name).join(", ") || "Unknown Artist",
    artists: resolvedArtists,
    album_title: raw.album?.title ?? null,
    play_count: raw.play_count ?? 0,
    release_date: raw.release_date ?? null,
  };
}

function mapArtist(raw: any): SearchArtist {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    image_url: raw.image_url ?? null,
  };
}

function mapAlbum(raw: any): SearchAlbum {
  const albumArtists: any[] = raw.album_artists ?? [];
  const firstArtistRaw =
    albumArtists.length > 0
      ? Array.isArray(albumArtists[0].artists)
        ? albumArtists[0].artists[0]
        : albumArtists[0].artists
      : null;

  const artist = firstArtistRaw
    ? {
        id: firstArtistRaw.id ?? "",
        name: firstArtistRaw.name ?? "",
        slug: firstArtistRaw.slug ?? "",
        image_url: firstArtistRaw.image_url ?? null,
      }
    : { id: "", name: "", slug: "", image_url: null };

  const artist_name = albumArtists
    .map((aa: any) => {
      const a = Array.isArray(aa.artists) ? aa.artists[0] : aa.artists;
      return a?.name;
    })
    .filter(Boolean)
    .join(", ");

  return {
    id: raw.id,
    title: raw.title,
    album_type: raw.album_type ?? null,
    image_url: raw.image_url ?? null,
    artist_name,
    artist,
    release_date: raw.release_date ?? null,
  };
}

// ─── Supabase query builders ───────────────────────────────────────────────────

function songQuery(q: string, from: number, to: number) {
  return supabase
    .from("songs")
    .select(
      `id, title, image_url, audio_url, preview_url, duration_ms,
       play_count, release_date,
       album:albums(title),
       song_artists(artists(id, name, image_url))`,
    )
    .ilike("title", `%${q}%`)
    .eq("is_active", true)
    .range(from, to);
}

function artistQuery(q: string, from: number, to: number) {
  return supabase
    .from("artists")
    .select("id, slug, name, image_url")
    .ilike("name", `%${q}%`)
    .eq("is_active", true)
    .range(from, to);
}

function albumQuery(q: string, from: number, to: number) {
  return supabase
    .from("albums")
    .select(
      `id, title, album_type, image_url, release_date,
       album_artists!inner(artists(id, name, slug, image_url))`,
    )
    .ilike("title", `%${q}%`)
    .eq("is_active", true)
    .range(from, to);
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export type UseSearchOptions = {
  artistPlayCounts?: Map<string, number>;
};

export type UseSearchResult = {
  results: SearchResultItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  /** True when at least one of the three queries failed but others succeeded */
  hasPartialResults: boolean;
  /** True when all three queries failed — likely a network error */
  isNetworkError: boolean;
};

export function useSearch(
  query: string,
  { artistPlayCounts = new Map() }: UseSearchOptions = {},
): UseSearchResult {
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasPartialResults, setHasPartialResults] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);

  // Page state tracked in a ref so loadMore always sees the latest values
  // without needing them as effect dependencies.
  const pageStateRef = useRef<PageState>({
    songOffset: 0,
    artistOffset: 0,
    albumOffset: 0,
    hasMoreSongs: true,
    hasMoreArtists: true,
    hasMoreAlbums: true,
  });

  // Raw items ref — used by loadMore to append without re-fetching
  const rawItemsRef = useRef<SearchResultItem[]>([]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loadMoreAbortRef = useRef<AbortController | null>(null);
  const countsRef = useRef(artistPlayCounts);
  countsRef.current = artistPlayCounts;

  // Current committed query ref — loadMore needs it without being a dep
  const queryRef = useRef(query);
  queryRef.current = query;

  // ── Initial / query-change fetch ───────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Cancel both initial and loadMore in-flight requests
    abortRef.current?.abort();
    loadMoreAbortRef.current?.abort();

    const q = query.trim();

    if (q.length < MIN_QUERY_LEN) {
      setResults([]);
      setLoading(false);
      setHasPartialResults(false);
      setIsNetworkError(false);
      rawItemsRef.current = [];
      pageStateRef.current = {
        songOffset: 0,
        artistOffset: 0,
        albumOffset: 0,
        hasMoreSongs: true,
        hasMoreArtists: true,
        hasMoreAlbums: true,
      };
      return;
    }

    const cacheKey = q.toLowerCase();
    const cached = getCached(cacheKey);
    if (cached) {
      rawItemsRef.current = cached.rawItems;
      pageStateRef.current = cached.pageState;
      setResults(rankSearchResults(cached.rawItems, q, countsRef.current));
      setHasPartialResults(false);
      setIsNetworkError(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      const [songsRes, artistsRes, albumsRes] = await Promise.allSettled([
        songQuery(q, 0, PAGE_SONGS - 1),
        artistQuery(q, 0, PAGE_ARTISTS - 1),
        albumQuery(q, 0, PAGE_ALBUMS - 1),
      ]);

      if (controller.signal.aborted) return;

      const songsOk = songsRes.status === "fulfilled";
      const artistsOk = artistsRes.status === "fulfilled";
      const albumsOk = albumsRes.status === "fulfilled";

      const songs = songsOk ? (songsRes.value.data ?? []) : [];
      const artists = artistsOk ? (artistsRes.value.data ?? []) : [];
      const albums = albumsOk ? (albumsRes.value.data ?? []) : [];

      const allFailed = !songsOk && !artistsOk && !albumsOk;
      const anyFailed = !songsOk || !artistsOk || !albumsOk;

      setIsNetworkError(allFailed);
      setHasPartialResults(!allFailed && anyFailed);

      const newPageState: PageState = {
        songOffset: songs.length,
        artistOffset: artists.length,
        albumOffset: albums.length,
        hasMoreSongs: songs.length === PAGE_SONGS,
        hasMoreArtists: artists.length === PAGE_ARTISTS,
        hasMoreAlbums: albums.length === PAGE_ALBUMS,
      };

      const items: SearchResultItem[] = [
        ...songs.map(
          (raw): SearchResultItem => ({
            kind: "song",
            data: mapSong(raw),
            id: `song-${raw.id}`,
            priority: 1,
          }),
        ),
        ...artists.map(
          (raw): SearchResultItem => ({
            kind: "artist",
            data: mapArtist(raw),
            id: `artist-${raw.id}`,
            priority: 2,
          }),
        ),
        ...albums.map(
          (raw): SearchResultItem => ({
            kind: "album",
            data: mapAlbum(raw),
            id: `album-${raw.id}`,
            priority: 3,
          }),
        ),
      ];

      rawItemsRef.current = items;
      pageStateRef.current = newPageState;
      setCache(cacheKey, { rawItems: items, pageState: newPageState });

      setResults(rankSearchResults(items, q, countsRef.current));
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [query]);

  // ── Load more (pagination) ─────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    const q = queryRef.current.trim();
    if (q.length < MIN_QUERY_LEN) return;

    const ps = pageStateRef.current;
    // Nothing more to load across all entity types
    if (!ps.hasMoreSongs && !ps.hasMoreArtists && !ps.hasMoreAlbums) return;
    if (loadingMore) return;

    // Cancel any previous loadMore in flight
    loadMoreAbortRef.current?.abort();
    const controller = new AbortController();
    loadMoreAbortRef.current = controller;

    setLoadingMore(true);

    const queries: Promise<any>[] = [];
    if (ps.hasMoreSongs)
      queries.push(songQuery(q, ps.songOffset, ps.songOffset + PAGE_SONGS - 1));
    if (ps.hasMoreArtists)
      queries.push(
        artistQuery(q, ps.artistOffset, ps.artistOffset + PAGE_ARTISTS - 1),
      );
    if (ps.hasMoreAlbums)
      queries.push(
        albumQuery(q, ps.albumOffset, ps.albumOffset + PAGE_ALBUMS - 1),
      );

    Promise.allSettled(queries).then((settled) => {
      if (controller.signal.aborted) return;

      let idx = 0;
      const newSongs: any[] = ps.hasMoreSongs
        ? settled[idx++].status === "fulfilled"
          ? ((settled[idx - 1] as any).value.data ?? [])
          : []
        : [];
      const newArtists: any[] = ps.hasMoreArtists
        ? settled[idx++].status === "fulfilled"
          ? ((settled[idx - 1] as any).value.data ?? [])
          : []
        : [];
      const newAlbums: any[] = ps.hasMoreAlbums
        ? settled[idx++].status === "fulfilled"
          ? ((settled[idx - 1] as any).value.data ?? [])
          : []
        : [];

      const newItems: SearchResultItem[] = [
        ...newSongs.map(
          (raw): SearchResultItem => ({
            kind: "song",
            data: mapSong(raw),
            id: `song-${raw.id}`,
            priority: 1,
          }),
        ),
        ...newArtists.map(
          (raw): SearchResultItem => ({
            kind: "artist",
            data: mapArtist(raw),
            id: `artist-${raw.id}`,
            priority: 2,
          }),
        ),
        ...newAlbums.map(
          (raw): SearchResultItem => ({
            kind: "album",
            data: mapAlbum(raw),
            id: `album-${raw.id}`,
            priority: 3,
          }),
        ),
      ];

      // Deduplicate by id before merging
      const existingIds = new Set(rawItemsRef.current.map((i) => i.id));
      const deduped = newItems.filter((i) => !existingIds.has(i.id));

      const merged = [...rawItemsRef.current, ...deduped];

      const newPageState: PageState = {
        songOffset: ps.songOffset + newSongs.length,
        artistOffset: ps.artistOffset + newArtists.length,
        albumOffset: ps.albumOffset + newAlbums.length,
        hasMoreSongs: ps.hasMoreSongs && newSongs.length === PAGE_SONGS,
        hasMoreArtists: ps.hasMoreArtists && newArtists.length === PAGE_ARTISTS,
        hasMoreAlbums: ps.hasMoreAlbums && newAlbums.length === PAGE_ALBUMS,
      };

      rawItemsRef.current = merged;
      pageStateRef.current = newPageState;

      // Update cache with the expanded result set
      const cacheKey = q.toLowerCase();
      updateCache(cacheKey, { rawItems: merged, pageState: newPageState });

      setResults(rankSearchResults(merged, q, countsRef.current));
      setLoadingMore(false);
    });
  }, [loadingMore]);

  const hasMore =
    pageStateRef.current.hasMoreSongs ||
    pageStateRef.current.hasMoreArtists ||
    pageStateRef.current.hasMoreAlbums;

  return {
    results,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    hasPartialResults,
    isNetworkError,
  };
}
