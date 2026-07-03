import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";
import LoadingDots from "../LoadingDots";

export type CreditEntry = {
  artistId: string;
  name: string;
  roles: string;
};

type Props = {
  credits: CreditEntry[];
  onShowAll?: () => void;
};

/** Derives follow map from profile.artist_preferences and credits list */
function buildFollowMap(
  prefs: string[] | null | undefined,
  credits: CreditEntry[],
): Record<string, boolean> {
  const list = prefs ?? [];
  const map: Record<string, boolean> = {};
  credits.forEach((c) => {
    // Check artist ID against stored preferences
    map[c.artistId] = list.includes(c.artistId);
  });
  return map;
}

export const CreditsCard = React.memo(function CreditsCard({
  credits,
  onShowAll,
}: Props) {
  const { user, profile, refreshProfile } = useAuth();

  // Initialise synchronously so there's no flash of "Follow" before "Following"
  const [following, setFollowing] = useState<Record<string, boolean>>(() =>
    buildFollowMap(profile?.artist_preferences, credits),
  );
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Re-sync whenever profile.artist_preferences or credits change
  useEffect(() => {
    setFollowing(buildFollowMap(profile?.artist_preferences, credits));
  }, [profile?.artist_preferences, credits]);

  const toggle = useCallback(
    async (artistId: string, artistName: string) => {
      if (!user) {
        toast.error("Sign in to follow artists");
        return;
      }

      if (artistId.startsWith("unknown-") || artistId === "mock") {
        toast.error("Cannot follow an unverified artist.");
        return;
      }

      const isFollowing = following[artistId] ?? false;

      // Optimistic update
      setFollowing((prev) => ({ ...prev, [artistId]: !isFollowing }));
      setLoading((prev) => ({ ...prev, [artistId]: true }));

      try {
        const current = profile?.artist_preferences ?? [];
        const updated = isFollowing
          ? current.filter((id) => id !== artistId)
          : [...current, artistId];

        const { error } = await supabase
          .from("profiles")
          .update({ artist_preferences: updated })
          .eq("id", user.id);

        if (error) throw error;

        await refreshProfile();
        toast.success(
          isFollowing ? `Unfollowed ${artistName}` : `Following ${artistName}`,
        );
      } catch {
        // Revert optimistic update on error
        setFollowing((prev) => ({ ...prev, [artistId]: isFollowing }));
        toast.error("Something went wrong. Try again.");
      } finally {
        setLoading((prev) => ({ ...prev, [artistId]: false }));
      }
    },
    [user, profile?.artist_preferences, following, refreshProfile],
  );

  return (
    <View
      style={{
        marginTop: 16,
        backgroundColor: "#1e1e1e",
        borderRadius: 16,
        padding: 20,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontFamily: "CircularStd",
            fontWeight: "600",
          }}
        >
          Credits
        </Text>
        <TouchableOpacity onPress={onShowAll}>
          <Text
            style={{
              color: "#1DB954",
              fontSize: 14,
              fontFamily: "CircularStd",
              fontWeight: "600",
            }}
          >
            Show all
          </Text>
        </TouchableOpacity>
      </View>

      {/* Credit rows */}
      {credits.map((credit, i) => {
        const isFollowing = following[credit.artistId] ?? false;
        const isLoading = loading[credit.artistId] ?? false;

        return (
          <View
            key={credit.artistId}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: i < credits.length - 1 ? 20 : 0,
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                  marginBottom: 4,
                }}
              >
                {credit.name}
              </Text>
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 12,
                  fontFamily: "CircularStd",
                }}
              >
                {credit.roles}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => toggle(credit.artistId, credit.name)}
              activeOpacity={0.8}
              disabled={isLoading}
              style={{
                borderWidth: 1,
                borderColor: "#a7a7a7",
                backgroundColor: "transparent",
                paddingHorizontal: 20,
                paddingVertical: 9,
                borderRadius: 50,
                minWidth: 96,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isLoading ? (
                <LoadingDots inline />
              ) : (
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                  }}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
});
