import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

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

type Props = {
  title: string;
  onAvatarPress: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightIcon2?: keyof typeof Ionicons.glyphMap;
  onRightPress2?: () => void;
  paddingBottom?: number;
};

export default function TabScreenHeader({
  title,
  onAvatarPress,
  rightIcon,
  onRightPress,
  rightIcon2,
  onRightPress2,
  paddingBottom = 20,
}: Props) {
  const { user, profile } = useAuth();

  const displayName =
    profile?.display_name ??
    user?.user_metadata?.display_name ??
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    user?.phone ??
    "";

  const avatarLetter = displayName.charAt(0).toUpperCase() || "?";
  const avatarColor = useMemo(
    () => AVATAR_COLORS[displayName.charCodeAt(0) % AVATAR_COLORS.length],
    [displayName],
  );

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom,
      }}
    >
      {/* Left: avatar + title */}
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}
      >
        <TouchableOpacity
          onPress={onAvatarPress}
          activeOpacity={0.8}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: avatarColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 15,
              fontWeight: "600",
              fontFamily: "CircularStd",
            }}
          >
            {avatarLetter}
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            color: "#ffffff",
            fontSize: 22,
            fontWeight: "600",
            fontFamily: "CircularStd",
          }}
        >
          {title}
        </Text>
      </View>

      {/* Right: optional icons */}
      {(rightIcon || rightIcon2) && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          {rightIcon && (
            <TouchableOpacity onPress={onRightPress} activeOpacity={0.7}>
              <Ionicons name={rightIcon} size={26} color="#ffffff" />
            </TouchableOpacity>
          )}
          {rightIcon2 && (
            <TouchableOpacity onPress={onRightPress2} activeOpacity={0.7}>
              <Ionicons name={rightIcon2} size={26} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
