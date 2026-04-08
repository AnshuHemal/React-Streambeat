import { TrendingSearch } from "@/types/search";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  item: TrendingSearch;
  rank: number;
  onPress: () => void;
};

export function TrendingRow({ item, rank, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 13,
        gap: 16,
      }}
    >
      {/* Rank number */}
      <Text
        style={{
          color: "#535353",
          fontFamily: "CircularStd",
          fontSize: 14,
          fontWeight: "600",
          width: 20,
          textAlign: "center",
        }}
      >
        {rank}
      </Text>

      {/* Query text */}
      <Text
        style={{
          flex: 1,
          color: "#ffffff",
          fontFamily: "CircularStd",
          fontSize: 15,
          fontWeight: "500",
        }}
        numberOfLines={1}
      >
        {item.query}
      </Text>

      {/* Trending fire icon */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: "#1a1a1a",
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        }}
      >
        <Ionicons name="trending-up" size={13} color="#1DB954" />
        <Text
          style={{
            color: "#1DB954",
            fontFamily: "CircularStd",
            fontSize: 11,
            fontWeight: "600",
          }}
        >
          Trending
        </Text>
      </View>
    </TouchableOpacity>
  );
}
