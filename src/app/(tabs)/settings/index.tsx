import BottomDialog from "@/components/BottomDialog";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
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
    image: require("@/assets/images/ico-24-musical-box.png"),
    title: "Apps and devices",
    subtitle: "Google Maps • Streambeat Connect control",
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
  {
    image: require("@/assets/images/ico-24-plus-arrrow-down.png"),
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
  }
];

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

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
          Settings
        </Text>

        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => router.push("/(tabs)/settings/search" as any)}
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
                fontWeight: "600",
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
            onPress={() => {
              if (item.title === "Account")
                router.push("/(tabs)/settings/account" as any);
              if (item.title === "Privacy and social")
                router.push("/(tabs)/settings/privacy-social" as any);
              if (item.title === "Playback")
                router.push("/(tabs)/settings/playback" as any);
              if (item.title === "Advertisements")
                router.push("/(tabs)/settings/advertisements" as any);
              if (item.title === "Apps and devices")
                router.push("/(tabs)/settings/apps-devices" as any);
              if (item.title === "Data-saving and offline")
                router.push("/(tabs)/settings/data-saving" as any);
              if (item.title === "Media quality")
                router.push("/(tabs)/settings/media-quality" as any);
              if (item.title === "Notifications")
                router.push("/(tabs)/settings/notifications" as any);
              if (item.title === "Content and display")
                router.push("/(tabs)/settings/content-display" as any);
              if (item.title === "About and support")
                router.push("/(tabs)/settings/about" as any);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 12,
              gap: 16,
            }}
          >
            {(item as any).image ? (
              <Image
                source={(item as any).image}
                style={{ width: 26, height: 26, tintColor: "#ffffff" }}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name={item.icon as any} size={26} color="#ffffff" />
            )}
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
                  fontSize: 12,
                  fontFamily: "CircularStd",
                }}
                numberOfLines={1}
              >
                {item.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Log out button */}
        <View style={{ alignItems: "center", paddingVertical: 22 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setLogoutDialogVisible(true)}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 50,
              paddingVertical: 12,
              paddingHorizontal: 28,
            }}
          >
            <Text
              style={{
                color: "#121212",
                fontSize: 14,
                fontWeight: "600",
                fontFamily: "CircularStd",
              }}
            >
              Log out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomDialog
        visible={logoutDialogVisible}
        title="Logout User ?"
        description="Are you sure you want to log out of Streambeat?"
        confirmLabel="Log out"
        dismissLabel="Cancel"
        onConfirm={() => {
          setLogoutDialogVisible(false);
          signOut();
        }}
        onDismiss={() => setLogoutDialogVisible(false)}
      />
    </SafeAreaView>
  );
}
