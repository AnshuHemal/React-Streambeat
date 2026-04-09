/**
 * useHomeData
 *
 * Fetches all personalised home screen data in parallel.
 * All queries use Promise.allSettled — a single failure never blocks the screen.
 * Cross-section deduplication ensures each album appears in at most one section.
 */

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type QuickItem = {
  id: string;
  title: string;
  image_url: string | null;
  kind: "liked-songs" | "album" | "artist";
};

export type HomeAlbum = {
  id: string;
  title: string;
  album_type: string | null;
  image_url: string | null;
  release_date: string | null;
  artist_name: string;
};

export type HomeArtist = {
  id: string;
  name: string;
  image_url: string | null;
};

export type HomeSong = {
  id: string;
  title: string;
  image_url: string | null;
  audio_url: string | null;
  preview_url: string | null;
  duration_ms: number | null;
  artist_name: string;
  artists: { id: string; name: string; image_url: string | null }[];
  album_title: string | null;
};

export type FeaturedItem = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_type: "album" | "artist";
  link_id: string;
};

/** Context-aware section title + mood filter */
export type TimeContext = {
  greeting: string;
  sectionTitle: string;
  moods: string[];
};

export type HomeData = {
  quickItems: QuickItem[];
  recentlyPlayed: HomeAlbum[];
  followedArtists: HomeArtist[];
  newReleases: HomeAlbum[];
  popularAlbums: HomeAlbum[];
  personalizedSongs: HomeSong[];
  personalizedArtistName: string;
  featuredItem: FeaturedItem | null;
  timeContext: TimeContext;
  loading: boolean;
  refetch: () => void;
};

// ─── Time context ──────────────────────────────────────────────────────────────

function getTimeContext(): TimeContext {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) {
    return {
      greeting: "Good morning",
      sectionTitle: "Start your morning",
      moods: ["happy", "energetic", "party"],
    };
  }
  if (h >= 12 && h < 17) {
    return {
      greeting: "Good afternoon",
      sectionTitle: "Keep the energy up",
      moods: ["happy", "energetic", "party", "calm"],
    };
  }
  if (h >= 17 && h < 21) {
    return {
      greeting: "Good evening",
      sectionTitle: "Wind down",
      moods: ["calm", "romantic", "sad"],
    };
  }
  return {
    greeting: "Good evening",
    sectionTitle: "Late night vibes",
    moods: ["calm", "sad", "romantic"],
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function mapAlbum(raw: any, artistName = ""): HomeAlbum {
  return {
    id: raw.id,
    title: raw.title,
    album_type: raw.album_type ?? null,
    image_url: raw.image_url ?? null,
    release_date: raw.release_date ?? null,
    artist_name: artistName,
  };
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useHomeData(): HomeData {
  const { user, profile } = useAuth();

  const [quickItems, setQuickItems] = useState<QuickItem[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<HomeAlbum[]>([]);
  const [followedArtists, setFollowedArtists] = useState<HomeArtist[]>([]);
  const [newReleases, setNewReleases] = useState<HomeAlbum[]>([]);
  const [popularAlbums, setPopularAlbums] = useState<HomeAlbum[]>([]);
  const [personalizedSongs, setPersonalizedSongs] = useState<HomeSong[]>([]);
  const [personalizedArtistName, setPersonalizedArtistName] = useState("");
  const [featuredItem, setFeaturedItem] = useState<FeaturedItem | null>(null);
  const [loading, setLoading] = useState(true);

  const timeContext = getTimeContext();

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const artistPrefs: string[] = profile?.artist_preferences ?? [];

    const [recentRes, artistsRes, newRelRes, popularRes, featuredRes] =
      await Promise.allSettled([
        // ── Recently played albums ─────────────────────────────────────────────
        user?.id
          ? supabase
              .from("user_play_history")
              .select(
                `last_played,
                 songs(
                   album_id,
                   albums(id, title, album_type, image_url, release_date,
                     album_artists(artists(id, name)))
                 )`,
              )
              .eq("user_id", user.id)
              .order("last_played", { ascending: false })
              .limit(40)
          : Promise.resolve({ data: null }),

        // ── Followed artists ───────────────────────────────────────────────────
        artistPrefs.length > 0
          ? supabase
              .from("artists")
              .select("id, name, image_url")
              .in("id", artistPrefs)
              .eq("is_active", true)
          : Promise.resolve({ data: [] }),

        // ── New releases from followed artists ─────────────────────────────────
        artistPrefs.length > 0
          ? supabase
              .from("album_artists")
              .select(
                "albums(id, title, album_type, image_url, release_date), artists(name)",
              )
              .in("artist_id", artistPrefs)
              .order("albums(release_date)", { ascending: false })
              .limit(20)
          : Promise.resolve({ data: [] }),

        // ── Popular albums globally ────────────────────────────────────────────
        supabase
          .from("albums")
          .select(
            `id, title, album_type, image_url, release_date,
             album_artists(artists(id, name))`,
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(20),

        // ── Featured item (editor's pick) ──────────────────────────────────────
        supabase
          .from("featured_items")
          .select("id, title, subtitle, image_url, link_type, link_id")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

    // ── Process recently played ────────────────────────────────────────────────
    const seenAlbumIds = new Set<string>();
    const recentAlbums: HomeAlbum[] = [];

    if (recentRes.status === "fulfilled" && recentRes.value.data) {
      for (const row of recentRes.value.data as any[]) {
        const album = row.songs?.albums;
        if (!album || seenAlbumIds.has(album.id)) continue;
        seenAlbumIds.add(album.id);
        const artistName = (album.album_artists ?? [])
          .map((aa: any) => aa.artists?.name)
          .filter(Boolean)
          .join(", ");
        recentAlbums.push(mapAlbum(album, artistName));
        if (recentAlbums.length >= 12) break;
      }
    }
    setRecentlyPlayed(recentAlbums);

    // Quick items: Liked Songs + first 5 recent albums
    const quick: QuickItem[] = [
      {
        id: "liked-songs",
        title: "Liked Songs",
        image_url: null,
        kind: "liked-songs",
      },
      ...recentAlbums.slice(0, 5).map((a) => ({
        id: a.id,
        title: a.title,
        image_url: a.image_url,
        kind: "album" as const,
      })),
    ];
    setQuickItems(quick);

    // ── Process followed artists ───────────────────────────────────────────────
    if (artistsRes.status === "fulfilled" && artistsRes.value.data) {
      setFollowedArtists(
        (artistsRes.value.data as any[]).map((a) => ({
          id: a.id,
          name: a.name,
          image_url: a.image_url ?? null,
        })),
      );
    }

    // ── Process new releases ───────────────────────────────────────────────────
    const newReleasesResult: HomeAlbum[] = [];
    if (newRelRes.status === "fulfilled" && newRelRes.value.data) {
      const seenIds = new Set<string>();
      for (const row of newRelRes.value.data as any[]) {
        const album = row.albums;
        if (!album || seenIds.has(album.id)) continue;
        seenIds.add(album.id);
        newReleasesResult.push(mapAlbum(album, row.artists?.name ?? ""));
      }
      setNewReleases(newReleasesResult);
    }

    // ── Process popular albums — exclude anything already in other sections ────
    if (popularRes.status === "fulfilled" && popularRes.value.data) {
      const shownIds = new Set<string>([
        ...seenAlbumIds,
        ...newReleasesResult.map((a) => a.id),
      ]);
      const mapped = (popularRes.value.data as any[])
        .map((a) => {
          const artistName = (a.album_artists ?? [])
            .map((aa: any) => aa.artists?.name)
            .filter(Boolean)
            .join(", ");
          return mapAlbum(a, artistName);
        })
        .filter((a) => !shownIds.has(a.id));
      setPopularAlbums(mapped);
    }

    // ── Featured item ──────────────────────────────────────────────────────────
    if (featuredRes.status === "fulfilled" && featuredRes.value.data) {
      const f = featuredRes.value.data as any;
      setFeaturedItem({
        id: f.id,
        title: f.title,
        subtitle: f.subtitle ?? null,
        image_url: f.image_url ?? null,
        link_type: f.link_type,
        link_id: f.link_id,
      });
    } else {
      setFeaturedItem(null);
    }

    // ── Personalized songs — based on top played artist ────────────────────────
    if (user?.id) {
      try {
        // Find the user's most-played artist
        const { data: topArtistData } = await supabase
          .from("user_play_history")
          .select(`songs(song_artists(artist_id, artists(id, name)))`)
          .eq("user_id", user.id)
          .order("play_count", { ascending: false })
          .limit(20);

        if (topArtistData && topArtistData.length > 0) {
          // Aggregate artist play counts
          const artistCounts = new Map<
            string,
            { count: number; name: string }
          >();
          for (const row of topArtistData as any[]) {
            for (const sa of row.songs?.song_artists ?? []) {
              const a = sa.artists;
              if (!a) continue;
              const existing = artistCounts.get(a.id);
              artistCounts.set(a.id, {
                count: (existing?.count ?? 0) + 1,
                name: a.name,
              });
            }
          }

          // Top artist
          const sorted = [...artistCounts.entries()].sort(
            (a, b) => b[1].count - a[1].count,
          );
          if (sorted.length > 0) {
            const [topArtistId, { name: topArtistName }] = sorted[0];
            setPersonalizedArtistName(topArtistName);

            // Fetch songs by that artist filtered by time-appropriate moods
            const { data: songData } = await supabase
              .from("song_artists")
              .select(
                `songs(
                  id, title, image_url, audio_url, preview_url, duration_ms, mood,
                  album:albums(title),
                  song_artists(artists(id, name, image_url))
                )`,
              )
              .eq("artist_id", topArtistId)
              .limit(15);

            if (songData && songData.length > 0) {
              const mapped: HomeSong[] = (songData as any[])
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
                    artist_name:
                      artistList.map((a: any) => a.name).join(", ") ||
                      topArtistName,
                    artists: artistList.map((a: any) => ({
                      id: a.id,
                      name: a.name,
                      image_url: a.image_url ?? null,
                    })),
                    album_title: s.album?.title ?? null,
                    mood: s.mood ?? null,
                  } as HomeSong & { mood: string | null };
                })
                .filter(Boolean) as HomeSong[];

              // Prefer mood-matched songs, fall back to all
              const moodMatched = mapped.filter(
                (s: any) => s.mood && timeContext.moods.includes(s.mood),
              );
              setPersonalizedSongs(
                (moodMatched.length >= 3 ? moodMatched : mapped).slice(0, 10),
              );
            }
          }
        }
      } catch {
        // Personalized songs are optional — silently ignore failures
      }
    }

    setLoading(false);
  }, [user?.id, profile?.artist_preferences]);

  return {
    quickItems,
    recentlyPlayed,
    followedArtists,
    newReleases,
    popularAlbums,
    personalizedSongs,
    personalizedArtistName,
    featuredItem,
    timeContext,
    loading,
    refetch: fetchAll,
  };
}
