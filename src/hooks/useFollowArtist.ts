/**
 * useFollowArtist
 *
 * Manages follow/unfollow state for a single artist using
 * profiles.artist_preferences — the same array used by the library screen.
 *
 * Optimistic update pattern:
 *   1. Toggle local state immediately (instant UI feedback)
 *   2. Write to Supabase in the background
 *   3. Call refreshProfile() so the library screen reflects the change
 *   4. Revert + toast on error
 *
 * Bounce animation on follow — same spring parameters as LikedSongsContext.
 */

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { toast } from "sonner-native";

export function useFollowArtist(artistId: string | undefined) {
  const { user, profile, refreshProfile } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [saving, setSaving] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Derive initial state from profile
  useEffect(() => {
    if (!artistId || !profile?.artist_preferences) {
      setIsFollowing(false);
      return;
    }
    setIsFollowing(profile.artist_preferences.includes(artistId));
  }, [artistId, profile?.artist_preferences]);

  const toggleFollow = useCallback(async () => {
    if (!user?.id || !artistId) {
      toast.error("Sign in to follow artists");
      return;
    }
    if (saving) return;

    const wasFollowing = isFollowing;

    // Optimistic update
    setIsFollowing(!wasFollowing);

    // Bounce animation on follow
    if (!wasFollowing) {
      scaleAnim.setValue(1);
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.15,
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
    }

    setSaving(true);
    try {
      const current = profile?.artist_preferences ?? [];
      const updated = wasFollowing
        ? current.filter((id) => id !== artistId)
        : [...current, artistId];

      const { error } = await supabase
        .from("profiles")
        .update({ artist_preferences: updated })
        .eq("id", user.id);

      if (error) throw error;

      // Sync profile context so library screen updates immediately
      await refreshProfile();

      toast.success(wasFollowing ? "Unfollowed" : `Following`);
    } catch {
      // Revert
      setIsFollowing(wasFollowing);
      scaleAnim.setValue(1);
      toast.error("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }, [
    user?.id,
    artistId,
    isFollowing,
    saving,
    profile,
    refreshProfile,
    scaleAnim,
  ]);

  return { isFollowing, toggleFollow, saving, scaleAnim };
}
