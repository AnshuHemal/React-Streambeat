import { SearchAlbum } from "@/types/search";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  album: SearchAlbum;
  onPress: () => void;
};

export function SearchAlbumRow({ album, onPress }: Props) {
  const albumType = album.album_type
    ? album.album_type.charAt(0).toUpperCase() + album.album_type.slice(1)
    : "Album";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 8,
        gap: 12,
      }}
    >
      {album.image_url ? (
        <Image
          source={{ uri: album.image_url }}
          style={{ width: 48, height: 48, borderRadius: 4 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 4,
            backgroundColor: "#2a2a2a",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="disc" size={24} color="#535353" />
        </View>
      )}

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
          {album.title}
        </Text>
        <Text
          style={{
            color: "#a7a7a7",
            fontFamily: "CircularStd",
            fontSize: 13,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {albumType}
          {album.artist_name ? ` • ${album.artist_name}` : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
