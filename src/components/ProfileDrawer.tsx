import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AVATAR_COLORS = [
  "#E91E63",
  "#9C27B0",
  "#3F51B5",
  "#2196F3",
  "#009688",
  "#FF5722",
  "#795548",
  "#607D8B",
];

const MENU_ITEMS = [
  { icon: "add", label: "Add account", route: null },
  { icon: "flash-outline", label: "What's new", route: null },
  { icon: "megaphone-outline", label: "Your Updates", route: null },
  {
    icon: "settings-outline",
    label: "Settings and privacy",
    route: "/(tabs)/settings",
  },
];

type Props = { onClose: () => void };

export default function ProfileDrawerContent({ onClose }: Props) {
  const { user, profile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const displayName =
    profile?.display_name ??
    user?.user_metadata?.display_name ??
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "User";

  const avatarLetter = displayName.charAt(0).toUpperCase();
  const avatarColor = useMemo(
    () => AVATAR_COLORS[displayName.charCodeAt(0) % AVATAR_COLORS.length],
    [displayName],
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#1a1a1a",
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 16,
      }}
    >
      {/* Profile header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#2a2a2a",
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: avatarColor,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 22,
              fontWeight: "600",
              fontFamily: "CircularStd",
            }}
          >
            {avatarLetter}
          </Text>
        </View>
        <Text
          style={{
            color: "#ffffff",
            fontSize: 18,
            fontWeight: "600",
            fontFamily: "CircularStd",
          }}
        >
          {displayName}
        </Text>
        <TouchableOpacity activeOpacity={0.7} style={{ marginTop: 2 }}>
          <Text
            style={{
              color: "#a7a7a7",
              fontSize: 13,
              fontFamily: "CircularStd",
            }}
          >
            View profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Menu items */}
      <View style={{ paddingTop: 8 }}>
        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              onClose();
              if (item.route) {
                // Wait for drawer close animation before navigating
                setTimeout(() => router.push(item.route as any), 280);
              }
            }}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              paddingHorizontal: 20,
              paddingVertical: 16,
            }}
          >
            <Ionicons name={item.icon as any} size={22} color="#ffffff" />
            <Text
              style={{
                color: "#ffffff",
                fontSize: 16,
                fontFamily: "CircularStd",
                fontWeight: "500",
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Log out */}
        <TouchableOpacity
          onPress={() => {
            onClose();
            signOut();
          }}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            paddingHorizontal: 20,
            paddingVertical: 16,
            marginTop: 8,
            borderTopWidth: 1,
            borderTopColor: "#2a2a2a",
          }}
        >
          <Ionicons name="log-out-outline" size={22} color="#a7a7a7" />
          <Text
            style={{
              color: "#a7a7a7",
              fontSize: 16,
              fontFamily: "CircularStd",
            }}
          >
            Log out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
