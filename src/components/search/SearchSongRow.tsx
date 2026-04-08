import { useLikedSongs } from "@/context/LikedSongsContext";
import { SearchSong } from "@/types/search";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

type Props = {
  song: SearchSong;
  isActive: boolean;
  onPress: () => void;
  onOptionsPress: () => void;
};

export function SearchSongRow({
  song,
  isActive,
  onPress,
  onOptionsPress,
}: Props) {
  const { isLiked: isLikedFn, toggleLike, getScaleAnim } = useLikedSongs();
  const liked = isLikedFn(song.id);
  const scaleAnim = getScaleAnim(song.id);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 14,
      }}
    >
      {/* Artwork */}
      {song.image_url ? (
        <Image
          source={{ uri: song.image_url }}
          style={{ width: 52, height: 52, borderRadius: 6 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 6,
            backgroundColor: "#2a2a2a",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="musical-note" size={24} color="#535353" />
        </View>
      )}

      {/* Title + subtitle */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: isActive ? "#1DB954" : "#ffffff",
            fontFamily: "CircularStd",
            fontSize: 16,
            fontWeight: "600",
          }}
          numberOfLines={1}
        >
          {song.title}
        </Text>
        <Text
          style={{
            color: "#a7a7a7",
            fontFamily: "CircularStd",
            fontSize: 13,
            marginTop: 3,
          }}
          numberOfLines={1}
        >
          Song{song.artist_name ? ` • ${song.artist_name}` : ""}
        </Text>
      </View>

      {/* Three-dots menu */}
      <TouchableOpacity
        onPress={onOptionsPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ paddingHorizontal: 4 }}
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#a7a7a7" />
      </TouchableOpacity>

      {/* Like / unlike — same pattern as mini player & expanded player */}
      <TouchableOpacity
        onPress={() => toggleLike(song.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ padding: 4 }}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={liked ? "checkmark-circle" : "add-circle-outline"}
            size={24}
            color={liked ? "#1DB954" : "#ffffff"}
          />
        </Animated.View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
