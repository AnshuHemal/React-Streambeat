import { HomeAlbum } from "@/hooks/useHomeData";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  album: HomeAlbum;
  onPress: () => void;
  size?: number;
};

export function HomeAlbumCard({ album, onPress, size = 144 }: Props) {
  const albumType = album.album_type
    ? album.album_type.charAt(0).toUpperCase() + album.album_type.slice(1)
    : "Album";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{ width: size }}
    >
      {album.image_url ? (
        <Image
          source={{ uri: album.image_url }}
          style={{
            width: size,
            height: size,
            borderRadius: 6,
            marginBottom: 8,
          }}
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
            marginBottom: 8,
          }}
        >
          <Ionicons name="disc" size={size * 0.28} color="#535353" />
        </View>
      )}
      <Text
        style={{
          color: "#ffffff",
          fontSize: 13,
          fontFamily: "CircularStd",
          fontWeight: "600",
        }}
        numberOfLines={1}
      >
        {album.title}
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
        {album.artist_name ? `${albumType} • ${album.artist_name}` : albumType}
      </Text>
    </TouchableOpacity>
  );
}
