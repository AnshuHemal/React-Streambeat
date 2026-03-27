import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  PermissionsAndroid,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NOTIFICATION_ITEMS = [
  { label: "Music and artists", status: "Off" },
  { label: "Podcasts and shows", status: "Off" },
  { label: "New podcast episodes", status: "No shows followed" },
  { label: "Audiobooks", status: "Off" },
  { label: "Social features", status: "Push" },
  { label: "Live concerts and events", status: "Off" },
  { label: "Virtual events", status: "Off" },
  { label: "Streambeat experiences made for you", status: "Off" },
  { label: "Merchandise", status: "Off" },
  { label: "Cultural news", status: "Off" },
  { label: "Streambeat features and tips", status: "Off" },
  { label: "Streambeat offers and bundles", status: "Off" },
  { label: "Surveys", status: "Off" },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Re-check every time screen comes into focus (handles returning from OS Settings)
  useFocusEffect(
    useCallback(() => {
      const check = async () => {
        if (Platform.OS === "android" && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          setNotificationsEnabled(granted);
        } else {
          setNotificationsEnabled(true);
        }
      };
      check();
    }, []),
  );

  const openSettings = () => Linking.openSettings();

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
          Notifications
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Warning banner — shown when notifications are off */}
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
              onPress={openSettings}
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

        {/* Subtitle */}
        <Text
          style={{
            color: "#a7a7a7",
            fontSize: 12,
            fontFamily: "CircularStd",
            paddingHorizontal: 20,
            paddingBottom: 8,
            lineHeight: 18,
          }}
        >
          Choose which push and email notifications you'd like to get.
        </Text>

        {/* Notification categories */}
        {NOTIFICATION_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.7}
            onPress={() => {
              if (item.label === "Social features") {
                router.push("/(tabs)/settings/social-features" as any);
              } else {
                router.push({
                  pathname: "/(tabs)/settings/notification-detail" as any,
                  params: { title: item.label },
                });
              }
            }}
            style={{ paddingHorizontal: 20, paddingVertical: 14 }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 16,
                fontWeight: "600",
                fontFamily: "CircularStd",
                marginBottom: 3,
              }}
            >
              {item.label}
            </Text>
            <Text
              style={{
                color: "#a7a7a7",
                fontSize: 12,
                fontFamily: "CircularStd",
              }}
            >
              {item.status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
