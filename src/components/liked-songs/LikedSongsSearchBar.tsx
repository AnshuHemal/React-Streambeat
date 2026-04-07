import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

type Props = {
  /** translateY driven by overscroll */
  translateY: Animated.AnimatedInterpolation<number>;
  /** opacity driven by overscroll */
  opacity: Animated.AnimatedInterpolation<number>;
  /** top offset = insets.top + back-arrow height */
  topOffset: number;
};

export function LikedSongsSearchBar({ translateY, opacity, topOffset }: Props) {
  return (
    <Animated.View
      style={{
        position: "absolute",
        top: topOffset,
        left: 0,
        right: 0,
        zIndex: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        opacity,
        transform: [{ translateY }],
      }}
      pointerEvents="none"
    >
      {/* Search field */}
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "rgba(255,255,255,0.15)",
          borderRadius: 8,
          paddingHorizontal: 12,
          height: 44,
          gap: 8,
        }}
      >
        <Ionicons name="search" size={18} color="rgba(255,255,255,0.7)" />
        <Text
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 15,
            fontFamily: "CircularStd",
            fontWeight: "600",
          }}
        >
          Find in Liked Songs
        </Text>
      </View>

      {/* Sort button */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={{
          backgroundColor: "rgba(255,255,255,0.15)",
          borderRadius: 8,
          paddingHorizontal: 16,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 15,
            fontFamily: "CircularStd",
            fontWeight: "600",
          }}
        >
          Sort
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
