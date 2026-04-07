/**
 * useLikedSongsData
 * Fetches the current user's liked songs from Supabase.
 * Returns the list, a loading flag, and a refetch function.
 */

import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

export type LikedSong = {
  id: string;
  title: string;
  artist_name: string;
  image_url: string | null;
  audio_url: string | null;
  preview_url: string | null;
  duration_ms: number | null;
  album_title?: string;
  artists?: { id: string; name: string; image_url: string | null }[];
};

export function useLikedSongsData() {
  const [songs, setSongs] = useState<LikedSong[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_liked_songs")
        .select(
          `
          song_id, liked_at,
          songs (
            id, title, image_url, audio_url, preview_url, duration_ms,
            album:albums(title),
            song_artists(artists(id, name, image_url))
          )
        `,
        )
        .order("liked_at", { ascending: false });

      if (error) throw error;

      const mapped: LikedSong[] = (data ?? [])
        .map((row: any) => {
          const s = row.songs;
          if (!s) return null;
          const artistList = (s.song_artists ?? [])
            .map((sa: any) => sa.artists)
            .filter(Boolean);
          return {
            id: s.id,
            title: s.title,
            artist_name:
              artistList.map((a: any) => a.name).join(", ") || "Unknown Artist",
            image_url: s.image_url,
            audio_url: s.audio_url,
            preview_url: s.preview_url,
            duration_ms: s.duration_ms,
            album_title: s.album?.title ?? undefined,
            artists: artistList.map((a: any) => ({
              id: a.id,
              name: a.name,
              image_url: a.image_url ?? null,
            })),
          } as LikedSong;
        })
        .filter(Boolean) as LikedSong[];

      setSongs(mapped);
    } catch {
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { songs, loading, refetch: fetch };
}
