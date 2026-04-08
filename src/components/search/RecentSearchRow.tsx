import { useLikedSongs } from "@/context/LikedSongsContext";
import { RecentSearchEntry } from "@/types/search";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

type Props = {
  entry: RecentSearchEntry;
  onPress: () => void;
  onAdd: () => void;
  onRemove: () => void;
};

export function RecentSearchRow({ entry, onPress, onAdd, onRemove }: Props) {
  const { isLiked: isLikedFn, toggleLike, getScaleAnim } = useLikedSongs();

  const isSong = entry.kind === "song";
  const isArtist = entry.kind === "artist";

  const songId = isSong ? entry.data.id : null;
  const liked = songId ? isLikedFn(songId) : false;
  const scaleAnim = songId ? getScaleAnim(songId) : null;

  // ── Display fields ─────────────────────────────────────────────────────────
  let title = "";
  let subtitle = "";
  let imageUrl: string | null = null;

  if (entry.kind === "song") {
    title = entry.data.title;
    subtitle = `Song${entry.data.artist_name ? ` • ${entry.data.artist_name}` : ""}`;
    imageUrl = entry.data.image_url;
  } else if (entry.kind === "artist") {
    title = entry.data.name;
    subtitle = "Artist";
    imageUrl = entry.data.image_url;
  } else {
    const albumType = entry.data.album_type
      ? entry.data.album_type.charAt(0).toUpperCase() +
        entry.data.album_type.slice(1)
      : "Album";
    title = entry.data.title;
    subtitle = `${albumType}${entry.data.artist_name ? ` • ${entry.data.artist_name}` : ""}`;
    imageUrl = entry.data.image_url;
  }

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
      {/* Artwork / Avatar */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 46, height: 46, borderRadius: isArtist ? 26 : 6 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: isArtist ? 26 : 6,
            backgroundColor: "#2a2a2a",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={isSong ? "musical-note" : isArtist ? "person" : "disc"}
            size={24}
            color="#535353"
          />
        </View>
      )}

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: "#ffffff",
            fontFamily: "CircularStd",
            fontSize: 15,
            fontWeight: "600",
          }}
          numberOfLines={1}
        >
          {title}
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
          {subtitle}
        </Text>
      </View>

      {/* Like button for songs, ⊕ for artist/album */}
      {isSong && songId && scaleAnim ? (
        <TouchableOpacity
          onPress={() => toggleLike(songId)}
          hitSlop={{ top: 10, bottom: 10 }}
          style={{ padding: 6 }}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={liked ? "checkmark-circle" : "add-circle-outline"}
              size={22}
              color={liked ? "#1DB954" : "#a7a7a7"}
            />
          </Animated.View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onAdd}
          hitSlop={{ top: 10, bottom: 10 }}
          style={{ padding: 6 }}
        >
          <Ionicons name="add-circle-outline" size={22} color="#a7a7a7" />
        </TouchableOpacity>
      )}

      {/* Remove (✕) */}
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 10, bottom: 10, right: 10 }}
        style={{ padding: 6 }}
      >
        <Ionicons name="close" size={20} color="#a7a7a7" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
