import { useMusicPlayer } from "@/context/MusicPlayerContext";
import React from "react";
import { Text, View } from "react-native";

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export const ProgressBar = React.memo(function ProgressBar() {
  const { position, duration } = useMusicPlayer();
  const pct = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <>
      <View style={{ marginBottom: 8 }}>
        <View
          style={{
            height: 4,
            backgroundColor: "rgba(255,255,255,0.3)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${pct}%`,
              height: "100%",
              backgroundColor: "#fff",
              borderRadius: 2,
            }}
          />
        </View>
        {pct > 0 && (
          <View
            style={{
              position: "absolute",
              left: `${pct}%`,
              top: -3,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#fff",
              marginLeft: -5,
            }}
          />
        )}
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <Text
          style={{ color: "#B3B3B3", fontSize: 12, fontFamily: "CircularStd" }}
        >
          {fmt(position)}
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

export const MiniProgressBar = React.memo(function MiniProgressBar() {
  const { position, duration } = useMusicPlayer();
  const pct = duration > 0 ? (position / duration) * 100 : 0;
  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 12,
        right: 12,
        height: 2,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <View
        style={{ width: `${pct}%`, height: "100%", backgroundColor: "#fff" }}
      />
    </View>
  );
});
