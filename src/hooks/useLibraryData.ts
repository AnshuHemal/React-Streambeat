import { supabase } from "@/lib/supabase";
import { LibraryItem } from "@/types/library";
import { Artist } from "@/types/music";
import { useEffect, useState } from "react";

export function useLibraryData(userId: string | undefined) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch user's profile to get selected artist IDs
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("artist_preferences")
          .eq("id", userId)
          .single();

        if (profileError) throw profileError;

        const artistIds = profile?.artist_preferences || [];

        // Fetch only the user's selected artists
        let artistItems: LibraryItem[] = [];
        if (artistIds.length > 0) {
          const { data: artistsData, error: artistsError } = await supabase
            .from("artists")
            .select("id, slug, name, image_url")
            .in("id", artistIds);

          if (artistsError) throw artistsError;

          artistItems =
            artistsData?.map((artist) => ({
              id: artist.id,
              title: artist.name,
              subtitle: "Artist",
              type: "artist" as const,
              image_url: artist.image_url,
              is_circular: true,
            })) || [];

          setArtists(artistsData || []);
        }

        // Add default items (Liked Songs, Your Episodes)
        const defaultItems: LibraryItem[] = [
          {
            id: "liked-songs",
            title: "Liked Songs",
            subtitle: "Playlist",
            type: "playlist",
            image_url: null,
          },
          {
            id: "your-episodes",
            title: "Your Episodes",
            subtitle: "Saved & downloaded",
            type: "podcast",
            image_url: null,
          },
        ];

        setLibraryItems([...defaultItems, ...artistItems]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  return { artists, libraryItems, loading, error };
}
