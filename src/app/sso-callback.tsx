import LoadingDots from "@/components/LoadingDots";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import React from "react";

export default function SSOCallbackScreen() {
  const { isLoaded, session } = useAuth();

  if (!isLoaded) {
    return <LoadingDots />;
  }

  if (session) {
    return <Redirect href="/(tabs)/index" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
