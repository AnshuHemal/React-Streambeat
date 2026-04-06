import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

const LINES = [
  "Hm, jaanaa, too aathaa nahin",
  "saponon se jaataa nahin",
  "mil jae, kya hee baath thi",
  "kamil ho jaataa vaheen",
  "jaanaa, mere savaalon ka\nmanzar too",
];

type Props = { bgColor: string };

export const LyricsCard = React.memo(function LyricsCard({ bgColor }: Props) {
  const [active, setActive] = useState(0);
  const scales = useRef(LINES.map(() => new Animated.Value(1))).current;
  const opacities = useRef(LINES.map(() => new Animated.Value(0.55))).current;

  useEffect(() => {
    LINES.forEach((_, i) => {
      Animated.parallel([
        Animated.timing(scales[i], {
          toValue: i === active ? 1.08 : 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacities[i], {
          toValue: i === active ? 1 : 0.55,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    });
    const t = setInterval(() => setActive((p) => (p + 1) % LINES.length), 2500);
    return () => clearInterval(t);
  }, [active]);

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
          <Animated.View
            key={i}
            style={{
              transform: [{ scale: scales[i] }],
              opacity: opacities[i],
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontFamily: "CircularStd",
                fontWeight: "600",
                lineHeight: 24,
              }}
            >
              {line}
            </Text>
          </Animated.View>
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
