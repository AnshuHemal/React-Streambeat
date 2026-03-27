import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  PermissionsAndroid,
  Platform,
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

// ── Descriptions per category ──────────────────────────────────
const DESCRIPTIONS: Record<string, string> = {
  "Music and artists":
    "Music and new releases from artists you follow or might like",
  "Podcasts and shows":
    "New episodes and updates from podcasts and shows you follow",
  "New podcast episodes": "New episodes from shows you follow",
  Audiobooks: "New audiobooks and updates from authors you follow",
  "Social features":
    "Friend activity, collaborative playlists, and social updates",
  "Live concerts and events":
    "Upcoming concerts and live events from artists you follow",
  "Virtual events":
    "Virtual concerts and online events from artists you follow",
  "Streambeat experiences made for you":
    "Personalized recommendations and curated experiences",
  Merchandise: "New merchandise drops from artists you follow",
  "Cultural news": "News and updates about music, culture, and entertainment",
  "Streambeat features and tips":
    "New features, tips, and updates about Streambeat",
  "Streambeat offers and bundles":
    "Special offers, deals, and bundle promotions",
  Surveys: "Occasional surveys to help improve your Streambeat experience",
};

export default function NotificationDetailScreen() {
  const router = useRouter();
  const { title, pushOnly } = useLocalSearchParams<{
    title: string;
    pushOnly?: string;
  }>();
  const isPushOnly = pushOnly === "1";

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [push, setPush] = useState(false);
  const [email, setEmail] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "android" && Platform.Version >= 33) {
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        ).then(setNotificationsEnabled);
      }
    }, []),
  );

  const description = DESCRIPTIONS[title ?? ""] ?? "";

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
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
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
            flex: 1,
            color: "#ffffff",
            fontSize: 18,
            fontWeight: "600",
            fontFamily: "CircularStd",
            textAlign: "center",
            marginRight: 36,
          }}
        >
          {title}
        </Text>
      </View>

      {/* Warning banner */}
      {!notificationsEnabled && (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: "#1e1e1e",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 15,
              fontWeight: "600",
              fontFamily: "CircularStd",
              marginBottom: 6,
            }}
          >
            This device has notifications turned off
          </Text>
          <Text
            style={{
              color: "#a7a7a7",
              fontSize: 12,
              fontFamily: "CircularStd",
              lineHeight: 18,
              marginBottom: 16,
            }}
          >
            You won't be notified, even if you turn on 'Push' below.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openSettings()}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#1DB954",
              borderRadius: 50,
              paddingVertical: 10,
              paddingHorizontal: 20,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                color: "#000000",
                fontSize: 14,
                fontWeight: "600",
                fontFamily: "CircularStd",
              }}
            >
              Go to Settings
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Description */}
      {description.length > 0 && (
        <Text
          style={{
            color: "#a7a7a7",
            fontSize: 12,
            fontFamily: "CircularStd",
            paddingHorizontal: 20,
            paddingBottom: 20,
            lineHeight: 18,
          }}
        >
          {description}
        </Text>
      )}

      {/* Where you'll receive notifications */}
      <Text
        style={{
          color: "#ffffff",
          fontSize: 20,
          fontWeight: "600",
          fontFamily: "CircularStd",
          paddingHorizontal: 20,
          paddingBottom: 8,
        }}
      >
        Where you'll receive notifications
      </Text>

      {/* Push */}
      <TouchableOpacity
        onPress={() => setPush((v) => !v)}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 18,
        }}
      >
        <Text
          style={{ color: "#ffffff", fontSize: 16, fontFamily: "CircularStd" }}
        >
          Push
        </Text>
        <Toggle value={push} onToggle={() => setPush((v) => !v)} />
      </TouchableOpacity>

      {/* Email — hidden for push-only items */}
      {!isPushOnly && (
        <TouchableOpacity
          onPress={() => setEmail((v) => !v)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 18,
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontFamily: "CircularStd",
            }}
          >
            Email
          </Text>
          <Toggle value={email} onToggle={() => setEmail((v) => !v)} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
