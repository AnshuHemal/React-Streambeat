import { Suggestion } from "@/types/search";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  suggestion: Suggestion;
  query: string;
  onPress: () => void;
};

export function SuggestionRow({ suggestion, query, onPress }: Props) {
  const q = query.trim().toLowerCase();
  const text = suggestion.text;
  const matchStart = text.toLowerCase().indexOf(q);

  // Split into before / match / after for inline highlight
  let before = text;
  let match = "";
  let after = "";
  if (matchStart !== -1 && q.length > 0) {
    before = text.slice(0, matchStart);
    match = text.slice(matchStart, matchStart + q.length);
    after = text.slice(matchStart + q.length);
  }

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 13,
        gap: 14,
      }}
    >
      <Ionicons name="search-outline" size={18} color="#a7a7a7" />

      <View style={{ flex: 1, flexDirection: "row", flexWrap: "nowrap" }}>
        {/* Before match — dimmed */}
        {before.length > 0 && (
          <Text
            style={{
              color: "#a7a7a7",
              fontFamily: "CircularStd",
              fontSize: 15,
            }}
            numberOfLines={1}
          >
            {before}
          </Text>
        )}
        {/* Matched portion — bright white bold */}
        {match.length > 0 && (
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 15,
              fontWeight: "600",
            }}
            numberOfLines={1}
          >
            {match}
          </Text>
        )}
        {/* After match — dimmed */}
        {after.length > 0 && (
          <Text
            style={{
              color: "#a7a7a7",
              fontFamily: "CircularStd",
              fontSize: 15,
            }}
            numberOfLines={1}
          >
            {after}
          </Text>
        )}
      </View>

      {/* Arrow — tap to fill the input without committing */}
      <Ionicons
        name="arrow-up-outline"
        size={16}
        color="#a7a7a7"
        style={{ transform: [{ rotate: "45deg" }] }}
      />
    </TouchableOpacity>
  );
}
