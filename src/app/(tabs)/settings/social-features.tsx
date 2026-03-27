import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    PermissionsAndroid,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUB_ITEMS = [{ label: "Jams", status: "Push", pushOnly: true }];

export default function SocialFeaturesScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "android" && Platform.Version >= 33) {
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        ).then(setNotificationsEnabled);
      }
    }, []),
  );

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
          Social features
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
        Choose which notifications you'd like to manage.
      </Text>

      {/* Sub-items */}
      {SUB_ITEMS.map((item, i) => (
        <TouchableOpacity
          key={i}
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/settings/notification-detail" as any,
              params: {
                title: item.label,
                pushOnly: item.pushOnly ? "1" : "0",
              },
            })
          }
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
    </SafeAreaView>
  );
}
