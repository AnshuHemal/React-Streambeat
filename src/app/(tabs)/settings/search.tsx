import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// All searchable settings items from both Settings and Account screens
const ALL_SETTINGS = [
  // Settings screen
  { label: "Account", subtitle: "Username • Email", section: "Settings" },
  {
    label: "Content and display",
    subtitle: "Languages for music • App language",
    section: "Settings",
  },
  {
    label: "Privacy and social",
    subtitle: "Private session • Public playlists",
    section: "Settings",
  },
  {
    label: "Playback",
    subtitle: "Gapless playback • Autoplay",
    section: "Settings",
  },
  { label: "Notifications", subtitle: "Push • Email", section: "Settings" },
  {
    label: "Apps and devices",
    subtitle: "Google Maps • Streambeat Connect control",
    section: "Settings",
  },
  {
    label: "Data-saving and offline",
    subtitle: "Data saver mode • Downloads over cellular",
    section: "Settings",
  },
  {
    label: "Media quality",
    subtitle: "Wi-Fi streaming quality • Audio quality",
    section: "Settings",
  },
  { label: "Advertisements", subtitle: "Tailored ads", section: "Settings" },
  {
    label: "About and support",
    subtitle: "Version • Privacy Policy",
    section: "Settings",
  },
  // Account screen
  { label: "Username", subtitle: "Your account username", section: "Account" },
  {
    label: "Email",
    subtitle: "Your account email address",
    section: "Account",
  },
  {
    label: "Address",
    subtitle: "View and change your address",
    section: "Account",
  },
  {
    label: "Account overview",
    subtitle: "View more account details on the web",
    section: "Account",
  },
  {
    label: "Your plan",
    subtitle: "Free plan • View your plan",
    section: "Account",
  },
  {
    label: "Close account",
    subtitle: "Delete your data permanently",
    section: "Account",
  },
];

export default function SettingsSearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");

  const results =
    query.trim().length > 0
      ? ALL_SETTINGS.filter(
          (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.subtitle.toLowerCase().includes(query.toLowerCase()),
        )
      : [];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#121212" }}
      edges={["top"]}
    >
      {/* Search header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#2a2a2a",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          autoFocus
          placeholder="Search for a setting"
          placeholderTextColor="#535353"
          value={query}
          onChangeText={setQuery}
          style={{
            flex: 1,
            color: "#ffffff",
            fontFamily: "CircularStd",
            fontSize: 16,
            padding: 0,
          }}
          selectionColor="#1DB954"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={20} color="#777" />
          </TouchableOpacity>
        )}
      </View>

      {/* Empty state */}
      {query.trim().length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 18,
              fontWeight: "600",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            What are you looking for?
          </Text>
          <Text
            style={{
              color: "#a7a7a7",
              fontFamily: "CircularStd",
              fontSize: 14,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Search for a specific setting or use a few keywords.
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <Text
            style={{
              color: "#a7a7a7",
              fontFamily: "CircularStd",
              fontSize: 15,
              textAlign: "center",
            }}
          >
            No results for "{query}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(_, i) => String(i)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#1e1e1e",
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontFamily: "CircularStd",
                  fontSize: 16,
                  marginBottom: 3,
                }}
              >
                {item.label}
              </Text>
              <Text
                style={{
                  color: "#a7a7a7",
                  fontFamily: "CircularStd",
                  fontSize: 13,
                }}
              >
                {item.section} · {item.subtitle}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
