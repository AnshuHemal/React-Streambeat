/**
 * FeaturedBanner
 * Full-width editorial banner shown at the top of the home screen.
 * Tapping navigates to the linked album or artist.
 */

import { FeaturedItem } from "@/hooks/useHomeData";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";

const { width: W } = Dimensions.get("window");
const BANNER_H = W * 0.52;

type Props = {
  item: FeaturedItem;
  onPress: () => void;
};

export function FeaturedBanner({ item, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        marginHorizontal: 16,
        marginBottom: 28,
        borderRadius: 12,
        overflow: "hidden",
        height: BANNER_H,
      }}
    >
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={300}
        />
      ) : (
        <View
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#1DB954",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="musical-notes" size={64} color="rgba(0,0,0,0.3)" />
        </View>
      )}

      {/* Gradient overlay */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        locations={[0.4, 1]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: BANNER_H * 0.6,
        }}
      />

      {/* Text */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
        }}
      >
        {item.subtitle && (
          <Text
            style={{
              color: "rgba(255,255,255,0.75)",
              fontFamily: "CircularStd",
              fontSize: 12,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            {item.subtitle}
          </Text>
        )}
        <Text
          style={{
            color: "#ffffff",
            fontFamily: "CircularStd",
            fontSize: 22,
            fontWeight: "700",
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
