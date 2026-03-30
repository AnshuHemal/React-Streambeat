import SettingHighlightRow from "@/components/SettingHighlightRow";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdvertisementsScreen() {
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
          Advertisements
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
        {/* Info text */}
        <Text
          style={{
            color: "#a7a7a7",
            fontSize: 13,
            fontFamily: "CircularStd",
            lineHeight: 20,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          Manage how ads are personalised for you on Streambeat.
        </Text>

        {/* Tailored ads */}
        <SettingHighlightRow label="Advertisements">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Linking.openURL("https://streambeat.app/ads/tailored")
            }
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 16,
              gap: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#1e1e1e",
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
                Tailored ads
              </Text>
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 12,
                  fontFamily: "CircularStd",
                  lineHeight: 18,
                }}
              >
                Control how ads are targeted to you based on your activity and
                preferences.
              </Text>
            </View>
            <Ionicons
              name="open-outline"
              size={20}
              color="#ffffff"
              style={{ marginTop: 2 }}
            />
          </TouchableOpacity>
        </SettingHighlightRow>

        {/* Ad privacy */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => Linking.openURL("https://streambeat.app/ads/privacy")}
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 16,
            gap: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#1e1e1e",
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
              Ad privacy
            </Text>
            <Text
              style={{
                color: "#a7a7a7",
                fontSize: 12,
                fontFamily: "CircularStd",
                lineHeight: 18,
              }}
            >
              Learn how Streambeat uses your data for advertising.
            </Text>
          </View>
          <Ionicons
            name="open-outline"
            size={20}
            color="#ffffff"
            style={{ marginTop: 2 }}
          />
        </TouchableOpacity>

        {/* Footer note */}
        <Text
          style={{
            color: "#a7a7a7",
            fontSize: 12,
            fontFamily: "CircularStd",
            lineHeight: 18,
            paddingHorizontal: 20,
            paddingTop: 20,
          }}
        >
          Changes to your ad preferences may take some time to take effect.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
