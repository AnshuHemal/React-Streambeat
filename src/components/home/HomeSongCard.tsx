/**
 * HomeSongCard
 * Compact song card for the "Based on [artist]" horizontal section.
 * Shows artwork, title, artist name, and a play button overlay.
 */

import { HomeSong } from "@/hooks/useHomeData";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  song: HomeSong;
  isActive: boolean;
  onPress: () => void;
  size?: number;
};

export function HomeSongCard({ song, isActive, onPress, size = 144 }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{ width: size }}
    >
      <View style={{ position: "relative", marginBottom: 8 }}>
        {song.image_url ? (
          <Image
            source={{ uri: song.image_url }}
            style={{ width: size, height: size, borderRadius: 6 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={{
              width: size,
              height: size,
              borderRadius: 6,
              backgroundColor: "#282828",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="musical-note" size={size * 0.28} color="#535353" />
          </View>
        )}

        {/* Play indicator when active */}
        {isActive && (
          <View
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#1DB954",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="musical-notes" size={14} color="#000000" />
          </View>
        )}
      </View>

      <Text
        style={{
          color: isActive ? "#1DB954" : "#ffffff",
          fontSize: 13,
          fontFamily: "CircularStd",
          fontWeight: "600",
        }}
        numberOfLines={1}
      >
        {song.title}
      </Text>
      <Text
        style={{
          color: "#B3B3B3",
          fontSize: 12,
          fontFamily: "CircularStd",
          marginTop: 2,
        }}
        numberOfLines={1}
      >
        {song.artist_name}
      </Text>
    </TouchableOpacity>
  );
}
