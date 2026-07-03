import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

type Props = {
  color?: string;
  size?: number;
  gap?: number;
  inline?: boolean;
};

export default function LoadingDots({
  color = "#ffffff",
  size = 12,
  gap = 10,
  inline = false,
}: Props) {
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

  const renderDots = () => (
    <View style={{ flexDirection: "row", gap, alignItems: "center", justifyContent: "center" }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
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
  );

  if (inline) {
    return renderDots();
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#121212",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {renderDots()}
    </View>
  );
}
