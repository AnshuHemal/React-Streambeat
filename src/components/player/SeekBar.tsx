import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { usePlayerPosition } from "@/context/PlayerPositionContext";
import Slider from "@react-native-community/slider";
import React, { useEffect, useState, useRef } from "react";
import { Text, View } from "react-native";

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export const SeekBar = React.memo(function SeekBar() {
  const { position, duration } = usePlayerPosition();
  const { seekTo, startSeeking, isPlaying, isSeeking } = useMusicPlayer();

  // localSeekPos tracks the user's drag position while sliding.
  // When not null, we render this value instead of the context position.
  const [localSeekPos, setLocalSeekPos] = useState<number | null>(null);

  // sliderVal is the value passed to the Slider component.
  const [sliderVal, setSliderVal] = useState(position);

  // We keep a ref to track the last sync timestamp to calculate local progress interpolation.
  const lastSyncTimeRef = useRef<number>(Date.now());

  // 1. Sync slider value with the context position when not dragging or actively seeking.
  useEffect(() => {
    lastSyncTimeRef.current = Date.now();
    
    // Only update if the user isn't actively dragging or waiting for native seek to confirm
    if (localSeekPos === null && !isSeeking) {
      setSliderVal(position);
    }
  }, [position, isSeeking, localSeekPos]);

  // 2. Smooth progress interpolation loop.
  // Continuously advances the progress slider at 60fps (16ms) while playing.
  // This eliminates the "jumping" effect and makes the seekbar glide smoothly.
  useEffect(() => {
    if (!isPlaying || isSeeking || localSeekPos !== null || duration <= 0) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastSyncTimeRef.current;
      const interpolatedPos = position + elapsed;
      
      // Do not exceed the song duration
      setSliderVal(Math.min(interpolatedPos, duration));
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [position, duration, isPlaying, isSeeking, localSeekPos]);

  return (
    <>
      <View style={{ paddingVertical: 4 }}>
        <Slider
          style={{ width: "100%", height: 30 }}
          minimumValue={0}
          maximumValue={duration > 0 ? duration : 1}
          value={sliderVal}
          minimumTrackTintColor="#fff"
          maximumTrackTintColor="rgba(255,255,255,0.3)"
          thumbTintColor="#fff"
          onSlidingStart={(val) => {
            startSeeking();
            setLocalSeekPos(val);
            setSliderVal(val);
          }}
          onValueChange={(val) => {
            setLocalSeekPos(val);
            setSliderVal(val);
          }}
          onSlidingComplete={async (val) => {
            setSliderVal(val);
            
            // Execute the seek
            await seekTo(val);
            
            // Clear the local drag position so it reverts back to tracking the context position
            setLocalSeekPos(null);
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
          {fmt(localSeekPos !== null ? localSeekPos : sliderVal)}
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
