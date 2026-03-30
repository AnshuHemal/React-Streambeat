import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";

/**
 * Returns an Animated.Value that flashes (0 → 1 → 0) once when the
 * screen receives a `highlight` param matching the given label.
 *
 * Usage in a settings screen:
 *   const flashAnim = useSettingHighlight("Gapless playback");
 *   <Animated.View style={{ backgroundColor: flashAnim.interpolate(...) }} />
 */
export function useSettingHighlight(label: string): Animated.Value {
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (highlight?.toLowerCase() === label.toLowerCase()) {
      // Small delay so the screen has time to render first
      const timer = setTimeout(() => {
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.delay(600),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: false,
          }),
        ]).start();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [highlight, label]);

  return anim;
}
