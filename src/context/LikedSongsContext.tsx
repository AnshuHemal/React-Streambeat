/**
 * LikedSongsContext.tsx
 * Global store for the current user's liked songs.
 *
 * - Loads the full set of liked song IDs once on mount
 * - Exposes isLiked(songId), toggleLike(songId), and the scaleAnim per song
 * - All consumers (player, options sheet, album screen) share the same state
 *   so toggling in one place instantly reflects everywhere
 */

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Animated } from "react-native";
import { toast } from "sonner-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type LikedSongsContextType = {
  /** Returns true if the given songId is in the liked set */
  isLiked: (songId: string) => boolean;
  /** Toggle like/unlike for a song. Returns the new liked state. */
  toggleLike: (songId: string) => Promise<void>;
  /** Per-song scale animation value for the bounce effect */
  getScaleAnim: (songId: string) => Animated.Value;
  /** Whether the initial load is complete */
  isReady: boolean;
};

const LikedSongsContext = createContext<LikedSongsContextType>({
  isLiked: () => false,
  toggleLike: async () => {},
  getScaleAnim: () => new Animated.Value(1),
  isReady: false,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LikedSongsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  // Set of liked song IDs — O(1) lookup
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);

  // Per-song scale animations — created lazily
  const scaleAnims = useRef<Map<string, Animated.Value>>(new Map());

  const getScaleAnim = useCallback((songId: string): Animated.Value => {
    if (!scaleAnims.current.has(songId)) {
      scaleAnims.current.set(songId, new Animated.Value(1));
    }
    return scaleAnims.current.get(songId)!;
  }, []);

  // ── Load all liked song IDs on mount / user change ─────────────────────────
  useEffect(() => {
    if (!user?.id) {
      setLikedIds(new Set());
      setIsReady(true);
      return;
    }

    setIsReady(false);

    supabase
      .from("user_liked_songs")
      .select("song_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const ids = new Set<string>(
          (data ?? []).map((r: any) => r.song_id as string),
        );
        setLikedIds(ids);
        setIsReady(true);
      });
  }, [user?.id]);

  // ── isLiked ────────────────────────────────────────────────────────────────
  const isLiked = useCallback(
    (songId: string) => likedIds.has(songId),
    [likedIds],
  );

  // ── toggleLike ─────────────────────────────────────────────────────────────
  const toggleLike = useCallback(
    async (songId: string) => {
      if (!user?.id) {
        toast.error("Sign in to like songs");
        return;
      }

      const wasLiked = likedIds.has(songId);
      const anim = getScaleAnim(songId);

      // Optimistic update
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(songId);
        else next.add(songId);
        return next;
      });

      // Bounce animation on like
      if (!wasLiked) {
        anim.setValue(1);
        Animated.sequence([
          Animated.spring(anim, {
            toValue: 1.35,
            useNativeDriver: true,
            tension: 200,
            friction: 5,
          }),
          Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 120,
            friction: 8,
          }),
        ]).start();
      } else {
        anim.setValue(1);
      }

      try {
        if (!wasLiked) {
          const { error } = await supabase
            .from("user_liked_songs")
            .insert({ user_id: user.id, song_id: songId });
          if (error) throw error;
          toast.success("Added to Liked Songs");
        } else {
          const { error } = await supabase
            .from("user_liked_songs")
            .delete()
            .eq("user_id", user.id)
            .eq("song_id", songId);
          if (error) throw error;
          toast.success("Removed from Liked Songs");
        }
      } catch {
        // Revert optimistic update
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(songId);
          else next.delete(songId);
          return next;
        });
        anim.setValue(1);
        toast.error("Something went wrong. Try again.");
      }
    },
    [user?.id, likedIds, getScaleAnim],
  );

  return (
    <LikedSongsContext.Provider
      value={{ isLiked, toggleLike, getScaleAnim, isReady }}
    >
      {children}
    </LikedSongsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLikedSongs() {
  return useContext(LikedSongsContext);
}
