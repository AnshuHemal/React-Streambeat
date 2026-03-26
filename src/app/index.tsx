import LoadingDots from "@/components/LoadingDots";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import React from "react";

export default function Index() {
  const { isLoaded, session, profile } = useAuth();

  if (!isLoaded) return <LoadingDots />;

  if (!session) return <Redirect href="/(auth)/sign-in" />;
  if (!profile) return <Redirect href="/(auth)/sign-in" />;

  if (!profile.notifications_seen)
    return <Redirect href={"/onboarding/notifications" as any} />;

  if (!profile.music_preferences || profile.music_preferences.length < 3)
    return <Redirect href={"/onboarding/music" as any} />;

  if (!profile.artist_preferences || profile.artist_preferences.length < 3)
    return <Redirect href={"/onboarding/artists" as any} />;

  if (!profile.onboarding_complete)
    return <Redirect href={"/onboarding/artists" as any} />;

  return <Redirect href="/(tabs)" />;
}
