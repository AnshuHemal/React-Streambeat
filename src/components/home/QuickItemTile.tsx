import { QuickItem } from "@/hooks/useHomeData";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  item: QuickItem;
  onPress: () => void;
};

export function QuickItemTile({ item, onPress }: Props) {
  const isLiked = item.kind === "liked-songs";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#282828",
        borderRadius: 6,
        overflow: "hidden",
        height: 56,
        flex: 1,
      }}
    >
      {/* Artwork */}
      {isLiked ? (
        <Image
          source={require("@/assets/images/liked-placeholder.png")}
          style={{ width: 56, height: 56 }}
          contentFit="cover"
        />
      ) : item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={{ width: 56, height: 56 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: 56,
            height: 56,
            backgroundColor: "#535353",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="musical-notes" size={22} color="#1DB954" />
        </View>
      )}

      {/* Title */}
      <Text
        style={{
          flex: 1,
          color: "#ffffff",
          fontSize: 12,
          fontFamily: "CircularStd",
          fontWeight: "600",
          paddingHorizontal: 12,
        }}
        numberOfLines={2}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );
}
