import React from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";

const CHIPS = ["Peaceful", "Love", "Happy", "Soulful", "Folk", "Soft"];

export function LikedSongsMoodChips() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        gap: 8,
        paddingVertical: 12,
      }}
    >
      {CHIPS.map((chip) => (
        <TouchableOpacity
          key={chip}
          activeOpacity={0.7}
          style={{
            paddingHorizontal: 18,
            paddingVertical: 9,
            borderRadius: 20,
            backgroundColor: "#2a2a2a",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 13,
              fontFamily: "CircularStd",
              fontWeight: "500",
            }}
          >
            {chip}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
