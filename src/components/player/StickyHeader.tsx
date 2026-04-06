import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { Image } from "expo-image";
import React from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  opacity: Animated.AnimatedInterpolation<number>;
  bgColor: string;
  artistName: string;
  isVisible: boolean;
};

export const StickyHeader = React.memo(function StickyHeader({
  opacity,
  bgColor,
  artistName,
  isVisible,
}: Props) {
  const insets = useSafeAreaInsets();
  const { currentSong, isPlaying, togglePlayPause } = useMusicPlayer();
  if (!currentSong) return null;

  return (
    <Animated.View
      pointerEvents={isVisible ? "auto" : "none"}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        opacity,
        backgroundColor: bgColor,
        paddingTop: insets.top,
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.15)",
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text
          numberOfLines={1}
          style={{
            color: "#fff",
            fontSize: 15,
            fontFamily: "CircularStd",
            fontWeight: "600",
          }}
        >
          {currentSong.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: 13,
            fontFamily: "CircularStd",
            marginTop: 2,
          }}
        >
          {artistName}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Image
            source={require("@/assets/images/ico-32-plus-circle.png")}
            style={{ width: 26, height: 26 }}
            contentFit="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={togglePlayPause}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Image
            source={
              isPlaying
                ? require("@/assets/images/ico-32-pause.png")
                : require("@/assets/images/ico-32-play.png")
            }
            style={{ width: 32, height: 32, tintColor: "#fff" }}
            contentFit="contain"
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});
