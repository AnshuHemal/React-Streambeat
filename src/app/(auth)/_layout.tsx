import { useAuth } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";

export default function AuthRoutesLayout() {
  const { isLoaded, session, profile } = useAuth();

  if (!isLoaded) return null;

  // Already logged in — let index.tsx decide where to go based on profile state
  if (session) {
    if (!profile) return null;

    if (!profile.notifications_seen)
      return <Redirect href={"/onboarding/notifications" as any} />;

    if (!profile.music_preferences || profile.music_preferences.length < 3)
      return <Redirect href={"/onboarding/music" as any} />;

    if (!profile.artist_preferences || profile.artist_preferences.length < 3)
      return <Redirect href={"/onboarding/artists" as any} />;

    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#121212" },
      }}
    />
  );
}
