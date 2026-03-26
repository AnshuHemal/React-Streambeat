import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SETTINGS_ITEMS = [
  {
    icon: "person-circle-outline",
    title: "Account",
    subtitle: "Username • Email",
  },
  {
    icon: "musical-note-outline",
    title: "Content and display",
    subtitle: "Languages for music • App language",
  },
  {
    icon: "lock-closed-outline",
    title: "Privacy and social",
    subtitle: "Private session • Public playlists",
  },
  {
    icon: "volume-medium-outline",
    title: "Playback",
    subtitle: "Gapless playback • Autoplay",
  },
  {
    icon: "notifications-outline",
    title: "Notifications",
    subtitle: "Push • Email",
  },
  {
    icon: "phone-portrait-outline",
    title: "Apps and devices",
    subtitle: "Google Maps • Streambeat Connect control",
  },
  {
    icon: "cloud-download-outline",
    title: "Data-saving and offline",
    subtitle: "Data saver mode • Downloads over cellular",
  },
  {
    icon: "bar-chart-outline",
    title: "Media quality",
    subtitle: "Wi-Fi streaming quality • Audio download quality",
  },
  {
    icon: "megaphone-outline",
    title: "Advertisements",
    subtitle: "Tailored ads",
  },
  {
    icon: "information-circle-outline",
    title: "About and support",
    subtitle: "Version • Privacy Policy",
  },
];

export default function SettingsScreen() {
  const router = useRouter();

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
            fontWeight: "700",
            fontFamily: "CircularStd",
          }}
        >
          Settings
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
        {/* Free account section */}
        <View style={{ alignItems: "center", paddingVertical: 24 }}>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 15,
              fontFamily: "CircularStd",
              marginBottom: 14,
            }}
          >
            Free account
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/premium" as any)}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 50,
              paddingVertical: 12,
              paddingHorizontal: 32,
            }}
          >
            <Text
              style={{
                color: "#121212",
                fontSize: 15,
                fontWeight: "700",
                fontFamily: "CircularStd",
              }}
            >
              Go Premium
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings list */}
        {SETTINGS_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 14,
              gap: 16,
            }}
          >
            <Ionicons name={item.icon as any} size={26} color="#ffffff" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 16,
                  fontWeight: "600",
                  fontFamily: "CircularStd",
                  marginBottom: 2,
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 13,
                  fontFamily: "CircularStd",
                }}
                numberOfLines={1}
              >
                {item.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
