import { useSettingHighlight } from "@/hooks/useSettingHighlight";
import React from "react";
import { Animated } from "react-native";

type Props = {
  /** Must match exactly the label string used in settingsSearch.ts */
  label: string;
  children: React.ReactNode;
};

/**
 * Wraps any settings row and flashes a green tint when the screen
 * is navigated to from the search screen with a matching highlight param.
 */
export default function SettingHighlightRow({ label, children }: Props) {
  const anim = useSettingHighlight(label);

  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(29,185,84,0)", "rgba(29,185,84,0.18)"],
  });

  return (
    <Animated.View style={{ backgroundColor: bg }}>{children}</Animated.View>
  );
}
