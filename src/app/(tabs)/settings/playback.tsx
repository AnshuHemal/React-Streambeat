import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Custom Toggle ──────────────────────────────────────────────
function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  const translateX = useRef(new Animated.Value(value ? 24 : 2)).current;
  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 24 : 2,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  }, [value]);
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={{
        width: 52,
        height: 30,
        borderRadius: 15,
        backgroundColor: value ? "#1DB954" : "transparent",
        borderWidth: value ? 0 : 2,
        borderColor: "#888888",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: value ? "#121212" : "#888888",
          transform: [{ translateX }],
        }}
      />
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        color: "#ffffff",
        fontSize: 22,
        fontWeight: "600",
        fontFamily: "CircularStd",
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 12,
      }}
    >
      {title}
    </Text>
  );
}

function ToggleRow({
  title,
  description,
  value,
  onToggle,
}: {
  title: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "600",
              fontFamily: "CircularStd",
              marginBottom: 4,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: "#a7a7a7",
              fontSize: 12,
              fontFamily: "CircularStd",
              lineHeight: 18,
            }}
          >
            {description}
          </Text>
        </View>
        <Toggle value={value} onToggle={onToggle} />
      </View>
    </View>
  );
}

function NavRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={{ paddingHorizontal: 20, paddingVertical: 14 }}
    >
      <Text
        style={{
          color: "#ffffff",
          fontSize: 16,
          fontWeight: "600",
          fontFamily: "CircularStd",
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: "#a7a7a7",
          fontSize: 12,
          fontFamily: "CircularStd",
          lineHeight: 18,
        }}
      >
        {description}
      </Text>
    </TouchableOpacity>
  );
}

export default function PlaybackScreen() {
  const router = useRouter();

  const [gapless, setGapless] = useState(false);
  const [automix, setAutomix] = useState(true);
  const [crossfade, setCrossfade] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [monoAudio, setMonoAudio] = useState(false);
  const [deviceBroadcast, setDeviceBroadcast] = useState(false);
  const [pictureInPicture, setPictureInPicture] = useState(false);
  const [volumeNormalization, setVolumeNormalization] = useState(true);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#121212" }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text
          style={{
            color: "#ffffff",
            fontSize: 18,
            fontWeight: "600",
            fontFamily: "CircularStd",
          }}
        >
          Playback
        </Text>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="search" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Track transitions */}
        <SectionHeader title="Track transitions" />

        <ToggleRow
          title="Gapless playback"
          description="Removes any gaps or pauses that may occur in between tracks."
          value={gapless}
          onToggle={() => setGapless((v) => !v)}
        />

        <ToggleRow
          title="Automix"
          description="Allows seamless transitions between songs on certain playlists."
          value={automix}
          onToggle={() => setAutomix((v) => !v)}
        />

        {/* Crossfade — slider row */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "600",
              fontFamily: "CircularStd",
              marginBottom: 4,
            }}
          >
            Crossfade
          </Text>
          <Text
            style={{
              color: "#a7a7a7",
              fontSize: 12,
              fontFamily: "CircularStd",
              lineHeight: 18,
              marginBottom: 16,
            }}
          >
            Adjust the length of fading and overlap in between tracks.
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={{
                color: "#a7a7a7",
                fontSize: 12,
                fontFamily: "CircularStd",
                width: 24,
              }}
            >
              {Math.round(crossfade)}s
            </Text>
            <Slider
              style={{ flex: 1, height: 50 }}
              minimumValue={0}
              maximumValue={12}
              step={1}
              value={crossfade}
              onValueChange={setCrossfade}
              minimumTrackTintColor="#1DB954"
              maximumTrackTintColor="#535353"
              thumbTintColor="#ffffff"
            />
            <Text
              style={{
                color: "#a7a7a7",
                fontSize: 12,
                fontFamily: "CircularStd",
                width: 28,
                textAlign: "right",
              }}
            >
              12s
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#2a2a2a", marginTop: 8 }} />

        {/* Listening controls */}
        <SectionHeader title="Listening controls" />

        <ToggleRow
          title="Autoplay"
          description="Similar content will play when what you're listening to ends."
          value={autoplay}
          onToggle={() => setAutoplay((v) => !v)}
        />

        <ToggleRow
          title="Mono audio"
          description="Left and right speakers play the same audio."
          value={monoAudio}
          onToggle={() => setMonoAudio((v) => !v)}
        />

        <ToggleRow
          title="Device broadcast status"
          description="Allows other apps on your device to show what you're listening to."
          value={deviceBroadcast}
          onToggle={() => setDeviceBroadcast((v) => !v)}
        />

        <NavRow
          title="Equalizer"
          description="Adjust different frequencies to enhance your audio experience."
        />

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#2a2a2a", marginTop: 8 }} />

        {/* Video controls */}
        <SectionHeader title="Video controls" />

        <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 16,
                  fontWeight: "600",
                  fontFamily: "CircularStd",
                  marginBottom: 4,
                }}
              >
                Picture in picture
              </Text>
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 12,
                  fontFamily: "CircularStd",
                  lineHeight: 18,
                }}
              >
                Shrink video in a mini player when you leave Streambeat, so you
                can continue watching while using apps.
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 6,
                  marginTop: 10,
                }}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#a7a7a7"
                  style={{ marginTop: 1 }}
                />
                <Text
                  style={{
                    color: "#a7a7a7",
                    fontSize: 12,
                    fontFamily: "CircularStd",
                    flex: 1,
                    lineHeight: 18,
                  }}
                >
                  In Android settings, go to Apps {">"} Special app access {">"}{" "}
                  Picture-in-picture {">"} Streambeat to allow picture in
                  picture.
                </Text>
              </View>
            </View>
            <Toggle
              value={pictureInPicture}
              onToggle={() => setPictureInPicture((v) => !v)}
            />
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#2a2a2a", marginTop: 8 }} />

        {/* Volume controls */}
        <SectionHeader title="Volume controls" />

        <ToggleRow
          title="Volume normalization"
          description="Sets the same loudness level for all tracks."
          value={volumeNormalization}
          onToggle={() => setVolumeNormalization((v) => !v)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
