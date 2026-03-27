import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Linking,
  PermissionsAndroid,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    // Android 13+ (API 33) requires POST_NOTIFICATIONS permission
    if (Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    // Below Android 13 — notifications are on by default
    return true;
  }
  // iOS — open settings since we can't request without expo-notifications
  Linking.openSettings();
  return false;
}

export default function OnboardingNotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const proceed = async (requestPermission = false) => {
    if (requestPermission) {
      await requestNotificationPermission();
      // Small delay to let the app fully return to foreground after the OS dialog
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    if (user) {
      await supabase
        .from("profiles")
        .update({ notifications_seen: true })
        .eq("id", user.id);
    }
    router.replace("/onboarding/music" as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        {/* Mock notification card */}
        <View
          style={{
            backgroundColor: "#1e1e1e",
            borderRadius: 16,
            padding: 16,
            width: "85%",
            marginBottom: 48,
            shadowColor: "#000",
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "#1DB954",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={require("@/assets/images/logo-white.png")}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </View>
            <Text
              style={{
                color: "#ffffff",
                fontFamily: "CircularStd",
                fontSize: 13,
                fontWeight: "600",
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              Streambeat
            </Text>
          </View>
          <View
            style={{
              height: 10,
              backgroundColor: "#2a2a2a",
              borderRadius: 5,
              marginBottom: 8,
              width: "80%",
            }}
          />
          <View
            style={{
              height: 10,
              backgroundColor: "#2a2a2a",
              borderRadius: 5,
              width: "55%",
            }}
          />
        </View>

        <Text
          style={{
            color: "#ffffff",
            fontSize: 24,
            fontWeight: "600",
            fontFamily: "CircularStd",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Turn on notifications
        </Text>
        <Text
          style={{
            color: "#a7a7a7",
            fontSize: 15,
            fontFamily: "CircularStd",
            textAlign: "center",
            marginBottom: 40,
            lineHeight: 22,
          }}
        >
          Get updates about new music, special offers, events and more.
        </Text>

        <TouchableOpacity
          onPress={() => proceed(true)}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 50,
            paddingVertical: 16,
            width: "100%",
            alignItems: "center",
            marginBottom: 16,
          }}
          activeOpacity={0.85}
        >
          <Text
            style={{
              color: "#000",
              fontWeight: "600",
              fontSize: 16,
              fontFamily: "CircularStd",
            }}
          >
            Turn on notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => proceed(false)}
          activeOpacity={0.7}
          style={{ paddingVertical: 12 }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontWeight: "600",
              fontSize: 16,
              fontFamily: "CircularStd",
            }}
          >
            Not now
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            color: "#a7a7a7",
            fontSize: 12,
            fontFamily: "CircularStd",
            textAlign: "center",
            marginTop: 40,
            lineHeight: 18,
            paddingHorizontal: 16,
          }}
        >
          Manage your notification categories in Settings at any time.
        </Text>
      </View>
    </SafeAreaView>
  );
}
