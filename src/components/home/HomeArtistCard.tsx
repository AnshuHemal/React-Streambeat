import { HomeArtist } from "@/hooks/useHomeData";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  artist: HomeArtist;
  onPress: () => void;
  size?: number;
};

export function HomeArtistCard({ artist, onPress, size = 120 }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{ width: size, alignItems: "center" }}
    >
      {artist.image_url ? (
        <Image
          source={{ uri: artist.image_url }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
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
            borderRadius: size / 2,
            backgroundColor: "#282828",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <Ionicons name="person" size={size * 0.38} color="#535353" />
        </View>
      )}
      <Text
        style={{
          color: "#ffffff",
          fontSize: 12,
          fontFamily: "CircularStd",
          fontWeight: "600",
          textAlign: "center",
        }}
        numberOfLines={2}
      >
        {artist.name}
      </Text>
      <Text
        style={{
          color: "#B3B3B3",
          fontSize: 11,
          fontFamily: "CircularStd",
          marginTop: 2,
        }}
      >
        Artist
      </Text>
    </TouchableOpacity>
  );
}
