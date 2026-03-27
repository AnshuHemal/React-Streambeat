import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Custom Toggle ──────────────────────────────────────────────
function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  const translateX = useRef(new Animated.Value(value ? 24 : 2)).current;
  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 24 : 2,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  }, [value]);
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={{
        width: 52,
        height: 30,
        borderRadius: 15,
        backgroundColor: value ? "#1DB954" : "transparent",
        borderWidth: value ? 0 : 2,
        borderColor: "#888888",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: value ? "#121212" : "#888888",
          transform: [{ translateX }],
        }}
      />
    </TouchableOpacity>
  );
}

// ── Section header ─────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        color: "#ffffff",
        fontSize: 22,
        fontWeight: "600",
        fontFamily: "CircularStd",
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 12,
      }}
    >
      {title}
    </Text>
  );
}

// ── Toggle row ─────────────────────────────────────────────────
function ToggleRow({
  title,
  description,
  value,
  onToggle,
  learnMore,
  note,
}: {
  title: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  learnMore?: boolean;
  note?: string;
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "600",
              fontFamily: "CircularStd",
              marginBottom: 4,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: "#a7a7a7",
              fontSize: 12,
              fontFamily: "CircularStd",
              lineHeight: 18,
            }}
          >
            {description}
          </Text>
          {learnMore && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 8,
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#a7a7a7"
              />
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 12,
                  fontFamily: "CircularStd",
                  textDecorationLine: "underline",
                }}
              >
                Learn more
              </Text>
            </TouchableOpacity>
          )}
          {note && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 6,
                marginTop: 8,
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#a7a7a7"
                style={{ marginTop: 1 }}
              />
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 12,
                  fontFamily: "CircularStd",
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                {note}
              </Text>
            </View>
          )}
        </View>
        <Toggle value={value} onToggle={onToggle} />
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────
export default function PrivacySocialScreen() {
  const router = useRouter();

  const [privateSession, setPrivateSession] = useState(false);
  const [listeningActivity, setListeningActivity] = useState(true);
  const [recentlyPlayedArtists, setRecentlyPlayedArtists] = useState(false);
  const [publicPlaylists, setPublicPlaylists] = useState(true);
  const [playlistsOnProfile, setPlaylistsOnProfile] = useState(true);
  const [followersVisible, setFollowersVisible] = useState(true);
  const [playlistsVisible, setPlaylistsVisible] = useState(true);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#121212" }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text
          style={{
            color: "#ffffff",
            fontSize: 18,
            fontWeight: "600",
            fontFamily: "CircularStd",
          }}
        >
          Privacy and social
        </Text>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="search" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Listening activity */}
        <SectionHeader title="Listening activity" />

        <ToggleRow
          title="Private session"
          description="Temporarily hides your listening activity everywhere, and ends after 6 hours."
          value={privateSession}
          onToggle={() => setPrivateSession((v) => !v)}
          learnMore
        />

        <ToggleRow
          title="Listening activity"
          description="Your followers can see what you're listening to in real time."
          value={listeningActivity}
          onToggle={() => setListeningActivity((v) => !v)}
        />

        <ToggleRow
          title="Recently played artists"
          description="People can see who you recently listened to on your profile."
          value={recentlyPlayedArtists}
          onToggle={() => setRecentlyPlayedArtists((v) => !v)}
        />

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#2a2a2a", marginTop: 8 }} />

        {/* Playlist visibility */}
        <SectionHeader title="Playlist visibility" />

        <ToggleRow
          title="Public playlists"
          description="New playlists you create will be viewable by others by default, and can be added to your profile."
          value={publicPlaylists}
          onToggle={() => setPublicPlaylists((v) => !v)}
          note="Only playlists that you make after changing this setting will be affected."
        />

        <ToggleRow
          title="Playlists appear on your profile"
          description="New playlists you create will be visible on your profile by default."
          value={playlistsOnProfile}
          onToggle={() => setPlaylistsOnProfile((v) => !v)}
          note="Only playlists that you make after changing this setting will be affected."
        />

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#2a2a2a", marginTop: 8 }} />

        {/* Profile visibility */}
        <SectionHeader title="Profile visibility" />

        <ToggleRow
          title="Followers and following"
          description="On your profile, people can see who's following you and who you follow."
          value={followersVisible}
          onToggle={() => setFollowersVisible((v) => !v)}
        />

        <ToggleRow
          title="Playlists"
          description="People can see the playlists you've added to your profile."
          value={playlistsVisible}
          onToggle={() => setPlaylistsVisible((v) => !v)}
        />

        {/* Blocked users — nav row */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ paddingHorizontal: 20, paddingVertical: 14 }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "600",
              fontFamily: "CircularStd",
              marginBottom: 4,
            }}
          >
            Blocked users
          </Text>
          <Text
            style={{
              color: "#a7a7a7",
              fontSize: 12,
              fontFamily: "CircularStd",
              lineHeight: 18,
            }}
          >
            Manage who you've blocked from viewing your profile.
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#2a2a2a", marginTop: 8 }} />

        {/* Social features */}
        <SectionHeader title="Social features" />

        <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 16,
                  fontWeight: "600",
                  fontFamily: "CircularStd",
                  marginBottom: 4,
                }}
              >
                Jam access with Bluetooth
              </Text>
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 12,
                  fontFamily: "CircularStd",
                  lineHeight: 18,
                }}
              >
                Use Bluetooth to connect to nearby devices and listen along with
                others.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                borderWidth: 1,
                borderColor: "#ffffff",
                borderRadius: 50,
                paddingVertical: 8,
                paddingHorizontal: 18,
                alignSelf: "center",
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: "600",
                  fontFamily: "CircularStd",
                }}
              >
                Activate
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: "#2a2a2a",
            marginTop: 8,
            marginBottom: 20,
          }}
        />

        {/* View more options */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ paddingHorizontal: 20, paddingBottom: 8 }}
        >
          <Text
            style={{
              color: "#a7a7a7",
              fontSize: 12,
              fontFamily: "CircularStd",
              lineHeight: 20,
            }}
          >
            <Text style={{ color: "#ffffff", textDecorationLine: "underline" }}>
              View more options
            </Text>{" "}
            on the Account Privacy page on the web.
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
