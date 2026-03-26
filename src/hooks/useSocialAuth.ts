import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { toast } from "sonner-native";

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
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.url) {
        toast.error("Could not initiate sign-in. Please try again.");
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );

      if (result.type === "success") {
        const parsedUrl = new URL(result.url);
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
          if (sessionError) toast.error(sessionError.message);
        }
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to sign in.");
    } finally {
      setLoadingStrategy(null);
    }
  };

  return { handleSocialAuth, loadingStrategy };
};

export default useSocialAuth;
