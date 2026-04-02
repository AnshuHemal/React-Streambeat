import LoadingDots from "@/components/LoadingDots";
import { useAuth } from "@/context/AuthContext";
import { Redirect, Tabs } from "expo-router";
import React from "react";

export default function TabsLayout() {
  const { isLoaded, session } = useAuth();

  if (!isLoaded) {
    return <LoadingDots />;
  }

  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
        sceneStyle: { backgroundColor: "#121212" },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="premium" />
      <Tabs.Screen name="settings" options={{ tabBarButton: () => null }} />
    </Tabs>
  );
}
