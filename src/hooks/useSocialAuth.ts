import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert } from "react-native";

WebBrowser.maybeCompleteAuthSession();

type SocialProvider = "google" | "apple";

const useSocialAuth = () => {
  const [loadingStrategy, setLoadingStrategy] = useState<SocialProvider | null>(
    null,
  );

  const handleSocialAuth = async (provider: SocialProvider) => {
    if (loadingStrategy) return;
    setLoadingStrategy(provider);
    try {
      const redirectTo = Linking.createURL("/sso-callback");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      if (!data.url) {
        Alert.alert("Error", "Could not initiate sign-in. Please try again.");
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );

      if (result.type === "success") {
        const url = result.url;
        const parsedUrl = new URL(url);

        // Extract tokens from the URL fragment or query params
        const accessToken =
          parsedUrl.searchParams.get("access_token") ??
          new URLSearchParams(parsedUrl.hash.slice(1)).get("access_token");
        const refreshToken =
          parsedUrl.searchParams.get("refresh_token") ??
          new URLSearchParams(parsedUrl.hash.slice(1)).get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            Alert.alert("Error", sessionError.message);
          }
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to sign in.");
    } finally {
      setLoadingStrategy(null);
    }
  };

  return { handleSocialAuth, loadingStrategy };
};

export default useSocialAuth;
