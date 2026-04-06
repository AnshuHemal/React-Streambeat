import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

const LINES = [
  "Hm, jaanaa, too aathaa nahin",
  "saponon se jaataa nahin",
  "mil jae, kya hee baath thi",
  "kamil ho jaataa vaheen",
  "jaanaa, mere savaalon ka manzar too",
];

type Props = { bgColor: string };

const LyricLine = React.memo(
  function LyricLine({ text, isActive }: { text: string; isActive: boolean }) {
    const opacity = useRef(new Animated.Value(isActive ? 1 : 0.38)).current;
    const translateX = useRef(new Animated.Value(isActive ? 6 : 0)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: isActive ? 1 : 0.38,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: isActive ? 6 : 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]).start();
    }, [isActive]);

    return (
      <Animated.View
        style={{
          opacity,
          transform: [{ translateX }],
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 17,
            fontFamily: "CircularStd",
            fontWeight: "600",
            lineHeight: 26,
          }}
        >
          {text}
        </Text>
      </Animated.View>
    );
  },
  (prev, next) => prev.isActive === next.isActive && prev.text === next.text,
);

export const LyricsCard = React.memo(function LyricsCard({ bgColor }: Props) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % LINES.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={{ borderRadius: 16, overflow: "hidden" }}>
      <LinearGradient
        colors={[bgColor, `${bgColor}cc`, `${bgColor}88`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={{ padding: 20 }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 15,
            fontFamily: "CircularStd",
            fontWeight: "600",
            marginBottom: 20,
          }}
        >
          Lyrics preview
        </Text>

        {LINES.map((line, i) => (
          <LyricLine key={i} text={line} isActive={i === active} />
        ))}

        <TouchableOpacity
          activeOpacity={0.85}
          style={{
            backgroundColor: "#fff",
            paddingHorizontal: 22,
            paddingVertical: 11,
            borderRadius: 50,
            alignSelf: "flex-start",
            marginTop: 8,
          }}
        >
          <Text
            style={{
              color: "#000",
              fontSize: 14,
              fontFamily: "CircularStd",
              fontWeight: "600",
            }}
          >
            Show lyrics
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
});
