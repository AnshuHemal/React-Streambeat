import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { usePlayerPosition } from "@/context/PlayerPositionContext";
import Slider from "@react-native-community/slider";
import React, { useState } from "react";
import { Text, View } from "react-native";

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export const SeekBar = React.memo(function SeekBar() {
  // Isolated context — only re-renders when position/duration changes, not on other state
  const { position, duration } = usePlayerPosition();
  const { seekTo } = useMusicPlayer();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPct, setSeekPct] = useState(0);

  const currentPct = duration > 0 ? Math.min(1, position / duration) : 0;
  const displayPct = isSeeking ? seekPct : currentPct;

  return (
    <>
      <View style={{ paddingVertical: 4 }}>
        <Slider
          style={{ width: "100%", height: 30 }}
          minimumValue={0}
          maximumValue={1}
          value={displayPct}
          minimumTrackTintColor="#fff"
          maximumTrackTintColor="rgba(255,255,255,0.3)"
          thumbTintColor="#fff"
          onSlidingStart={(val) => {
            setIsSeeking(true);
            setSeekPct(val);
          }}
          onValueChange={(val) => {
            if (isSeeking) setSeekPct(val);
          }}
          onSlidingComplete={async (val) => {
            await seekTo(val * duration);
            setIsSeeking(false);
          }}
        />
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 32,
          marginTop: -4,
          paddingHorizontal: 12,
        }}
      >
        <Text
          style={{ color: "#B3B3B3", fontSize: 12, fontFamily: "CircularStd" }}
        >
          {fmt(isSeeking ? seekPct * duration : position)}
        </Text>
        <Text
          style={{ color: "#B3B3B3", fontSize: 12, fontFamily: "CircularStd" }}
        >
          {fmt(duration)}
        </Text>
      </View>
    </>
  );
});
