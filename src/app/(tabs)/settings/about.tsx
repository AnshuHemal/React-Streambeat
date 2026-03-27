import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VERSION = "1.0.0";

const ITEMS = [
  { label: "Privacy Policy", url: "https://streambeat.app/privacy" },
  { label: "Third-party Licenses", url: null },
  { label: "Terms of Use", url: "https://streambeat.app/terms" },
  { label: "Platform Rules", url: "https://streambeat.app/rules" },
  { label: "Support", url: "https://streambeat.app/support" },
];

export default function AboutScreen() {
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
            fontWeight: "600",
            fontFamily: "CircularStd",
          }}
        >
          About and support
        </Text>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="search" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Version row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 18,
          borderBottomWidth: 1,
          borderBottomColor: "#1e1e1e",
        }}
      >
        <Text
          style={{ color: "#ffffff", fontSize: 16, fontFamily: "CircularStd" }}
        >
          Version
        </Text>
        <Text
          style={{ color: "#a7a7a7", fontSize: 15, fontFamily: "CircularStd" }}
        >
          {VERSION}
        </Text>
      </View>

      {/* Link rows */}
      {ITEMS.map((item, i) => (
        <TouchableOpacity
          key={i}
          activeOpacity={0.7}
          onPress={() => item.url && Linking.openURL(item.url)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 18,
            borderBottomWidth: 1,
            borderBottomColor: "#1e1e1e",
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontFamily: "CircularStd",
            }}
          >
            {item.label}
          </Text>
          {item.url && (
            <Ionicons name="open-outline" size={18} color="#ffffff" />
          )}
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}
