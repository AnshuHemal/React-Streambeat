import { usePlayerPosition } from "@/context/PlayerPositionContext";
import React from "react";
import { View } from "react-native";

/** Thin progress bar shown on the collapsed mini player */
export const MiniProgressBar = React.memo(function MiniProgressBar() {
  const { position, duration } = usePlayerPosition();
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
