import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  title: string;
  onShowAll?: () => void;
};

export function HomeSectionHeader({ title, onShowAll }: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginBottom: 14,
      }}
    >
      <Text
        style={{
          color: "#ffffff",
          fontSize: 20,
          fontWeight: "600",
          fontFamily: "CircularStd",
        }}
      >
        {title}
      </Text>
      {onShowAll && (
        <TouchableOpacity
          onPress={onShowAll}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={{
              color: "#B3B3B3",
              fontSize: 12,
              fontFamily: "CircularStd",
            }}
          >
            Show all
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
