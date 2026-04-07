/**
 * useLikedSong.ts
 * Manages the "Liked Songs" state for a single song.
 *
 * - Fetches liked status from user_liked_songs on mount / songId change
 * - Exposes toggleLike() with optimistic update + revert on error
 * - Returns isLiked, isLoading, toggleLike
 */

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { toast } from "sonner-native";

export type UseLikedSongReturn = {
  isLiked: boolean;
  isLoading: boolean;
  toggleLike: () => Promise<void>;
  /** Animated scale value — spring-bounces to 1.3 on like, instant reset on unlike */
  scaleAnim: Animated.Value;
};

export function useLikedSong(
  songId: string | null | undefined,
  /** Pass any value that changes when you want to force a re-fetch (e.g. sheet visible state) */
  refreshTrigger?: boolean | number | string,
): UseLikedSongReturn {
  const { user } = useAuth();

  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // ── Fetch liked status whenever songId, user, or refreshTrigger changes ─────
  useEffect(() => {
    if (!songId || !user?.id) {
      setIsLiked(false);
      return;
    }

    let cancelled = false;

    supabase
      .from("user_liked_songs")
      .select("id")
      .eq("user_id", user.id)
      .eq("song_id", songId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsLiked(!!data);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId, user?.id, refreshTrigger]);

  // ── Bounce animation on like ─────────────────────────────────────────────────
  const playLikeAnimation = useCallback(() => {
    scaleAnim.setValue(1);
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.35,
        useNativeDriver: true,
        tension: 200,
        friction: 5,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
    ]).start();
  }, [scaleAnim]);

  // ── Toggle ───────────────────────────────────────────────────────────────────
  const toggleLike = useCallback(async () => {
    if (!user?.id) {
      toast.error("Sign in to like songs");
      return;
    }
    if (!songId) return;

    const wasLiked = isLiked;

    // Optimistic update
    setIsLiked(!wasLiked);
    setIsLoading(true);

    if (!wasLiked) {
      // Play bounce animation when liking
      playLikeAnimation();
    } else {
      // Instant reset when unliking
      scaleAnim.setValue(1);
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
      setIsLiked(wasLiked);
      scaleAnim.setValue(1);
      toast.error("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, songId, isLiked, playLikeAnimation, scaleAnim]);

  return { isLiked, isLoading, toggleLike, scaleAnim };
}
