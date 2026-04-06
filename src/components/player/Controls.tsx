import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { Image } from "expo-image";
import React from "react";
import { TouchableOpacity, View } from "react-native";

type Props = {
  onLayout?: (y: number) => void;
  onTimerPress?: () => void;
};

export const Controls = React.memo(function Controls({
  onLayout,
  onTimerPress,
}: Props) {
  const { isPlaying, togglePlayPause, skipToNext, skipToPrevious } =
    useMusicPlayer();

  return (
    <View
      onLayout={onLayout ? (e) => onLayout(e.nativeEvent.layout.y) : undefined}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
      }}
    >
      <TouchableOpacity style={{ alignItems: "center" }}>
        <Image
          source={require("@/assets/images/ico-32-shuffle.png")}
          style={{ width: 28, height: 28, tintColor: "#1DB954" }}
          contentFit="contain"
        />
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#1DB954"}} />
      </TouchableOpacity>
      <TouchableOpacity onPress={skipToPrevious}>
        <Image
          source={require("@/assets/images/ico-32-back.png")}
          style={{ width: 32, height: 32, tintColor: "#fff" }}
          contentFit="contain"
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={togglePlayPause}
        activeOpacity={0.8}
        style={{
          width: 62,
          height: 62,
          borderRadius: 31,
          backgroundColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={
            isPlaying
              ? require("@/assets/images/ico-32-pause.png")
              : require("@/assets/images/ico-32-play.png")
          }
          style={{ width: 36, height: 36, tintColor: "#121212" }}
          contentFit="contain"
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={skipToNext}>
        <Image
          source={require("@/assets/images/ico-32-forward.png")}
          style={{ width: 32, height: 32, tintColor: "#fff" }}
          contentFit="contain"
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={onTimerPress}>
        <Image
          source={require("@/assets/images/ico-32-cronology.png")}
          style={{ width: 28, height: 28, tintColor: "#fff" }}
          contentFit="contain"
        />
      </TouchableOpacity>
    </View>
  );
});
