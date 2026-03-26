import { useAuth } from "@/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AVATAR_SIZE = 80;
const OVERLAP = 28;

function OverlappingAvatars({ images }: { images: string[] }) {
  // Show max 5 avatars
  const visible = images.slice(0, 5);
  const totalWidth =
    AVATAR_SIZE + (visible.length - 1) * (AVATAR_SIZE - OVERLAP);

  return (
    <View
      style={{ width: totalWidth, height: AVATAR_SIZE, position: "relative" }}
    >
      {visible.map((uri, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: i * (AVATAR_SIZE - OVERLAP),
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
            borderWidth: 3,
            borderColor: "#121212",
            overflow: "hidden",
            backgroundColor: "#2a2a2a",
            zIndex: i,
          }}
        >
          <Image
            source={{ uri }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>
      ))}
    </View>
  );
}

function LoadingMessage() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay((dots.length - i) * 150),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={{ alignItems: "center", gap: 16 }}>
      <Text
        style={{
          color: "#a7a7a7",
          fontFamily: "CircularStd",
          fontSize: 15,
          textAlign: "center",
        }}
      >
        Finding out music for you.
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#ffffff",
              opacity: dot,
              transform: [
                {
                  scale: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                },
              ],
            }}
          />
        ))}
      </View>
    </View>
  );
}

export default function GreatPicksScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { images: imagesParam } = useLocalSearchParams<{ images: string }>();

  const [showLoading, setShowLoading] = useState(false);

  // Parse the image URLs passed as a JSON string
  const images: string[] = (() => {
    try {
      return JSON.parse(imagesParam ?? "[]");
    } catch {
      return [];
    }
  })();

  // Phase 1: show "Great picks!" for 1.5s, then switch to loading message
  // Phase 2: show loading for 2s, then navigate
  useEffect(() => {
    const t1 = setTimeout(() => setShowLoading(true), 1500);
    const t2 = setTimeout(async () => {
      await refreshProfile();
      router.replace("/(tabs)");
    }, 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
        }}
      >
        <OverlappingAvatars images={images} />

        {!showLoading ? (
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 26,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Great picks!
          </Text>
        ) : (
          <LoadingMessage />
        )}
      </View>
    </SafeAreaView>
  );
}
