import React, { useEffect, useState } from "react";
import { Image, StyleProp, ViewStyle } from "react-native";

const frames = [
  require("@/assets/images/music_anim_1.png"),
  require("@/assets/images/music_anim_2.png"),
  require("@/assets/images/music_anim_3.png"),
  require("@/assets/images/music_anim_4.png"),
  require("@/assets/images/music_anim_5.png"),
  require("@/assets/images/music_anim_6.png"),
  require("@/assets/images/music_anim_7.png"),
];

type Props = {
  isPlaying: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function PlayingIndicator({ isPlaying, style }: Props) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    // Cycle through 7 frames sequentially
    const intervalId = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 150);

    return () => clearInterval(intervalId);
  }, [isPlaying]);

  return (
    <Image
      source={frames[frameIndex]}
      style={[{ width: 14, height: 14, tintColor: "#1DB954" }, style]}
      resizeMode="contain"
    />
  );
}
