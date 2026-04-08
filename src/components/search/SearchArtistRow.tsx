import { SearchArtist } from "@/types/search";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  artist: SearchArtist;
  onPress: () => void;
};

export function SearchArtistRow({ artist, onPress }: Props) {
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
      {artist.image_url ? (
        <Image
          source={{ uri: artist.image_url }}
          style={{ width: 48, height: 48, borderRadius: 24 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "#2a2a2a",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="person" size={24} color="#535353" />
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
          {artist.name}
        </Text>
        <Text
          style={{
            color: "#a7a7a7",
            fontFamily: "CircularStd",
            fontSize: 13,
            marginTop: 2,
          }}
        >
          Artist
        </Text>
      </View>
    </TouchableOpacity>
  );
}
