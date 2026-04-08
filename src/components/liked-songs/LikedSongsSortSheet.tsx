/**
 * LikedSongsSortSheet
 * Sort options sheet — same entry/exit animations and styling as SongOptionsSheet.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type LikedSongsSortOption =
  | "title"
  | "artist"
  | "album"
  | "recently_added";

const SORT_OPTIONS: { value: LikedSongsSortOption; label: string }[] = [
  { value: "title", label: "Title" },
  { value: "artist", label: "Artist" },
  { value: "album", label: "Album" },
  { value: "recently_added", label: "Recently added" },
];

const { height: SCREEN_H } = Dimensions.get("window");
const DISMISS_THRESHOLD = 80;

type Props = {
  visible: boolean;
  selected: LikedSongsSortOption;
  onSelect: (option: LikedSongsSortOption) => void;
  onClose: () => void;
};

export function LikedSongsSortSheet({
  visible,
  selected,
  onSelect,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
    translateY.setValue(SCREEN_H);
    dragY.setValue(0);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_H,
        duration: 260,
        useNativeDriver: true,
        easing: (t) => t * t * t,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => callback?.());
  };

  useEffect(() => {
    if (visible) animateIn();
    else animateOut();
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, gs) => gs.dy > 4,
      onPanResponderGrant: () => dragY.setValue(0),
      onPanResponderMove: (_e, gs) => {
        if (gs.dy > 0) {
          dragY.setValue(gs.dy);
          backdropOpacity.setValue(
            1 - Math.min(gs.dy / DISMISS_THRESHOLD, 1) * 0.6,
          );
        }
      },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dy > DISMISS_THRESHOLD || gs.vy > 0.5) {
          animateOut(() => {
            dragY.setValue(0);
            onClose();
          });
        } else {
          Animated.parallel([
            Animated.spring(dragY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 80,
              friction: 12,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    }),
  ).current;

  const combinedY = Animated.add(translateY, dragY);

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            opacity: backdropOpacity,
          }}
        />
      </TouchableWithoutFeedback>

      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View
          style={{
            backgroundColor: "#1e1e1e",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY: combinedY }],
          }}
        >
          {/* Drag handle */}
          <View
            {...panResponder.panHandlers}
            style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                backgroundColor: "#535353",
                borderRadius: 2,
              }}
            />
          </View>

          {/* "Sort by" title */}
          <View
            {...panResponder.panHandlers}
            style={{
              paddingHorizontal: 20,
              paddingTop: 14,
              paddingBottom: 8,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 17,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              Sort by
            </Text>
          </View>

          {/* Options */}
          {SORT_OPTIONS.map((opt) => {
            const isActive = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  onSelect(opt.value);
                  onClose();
                }}
                activeOpacity={0.65}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#1DB954" : "#e3e3e3",
                    fontSize: 16,
                    fontFamily: "CircularStd",
                    fontWeight: isActive ? "600" : "400",
                  }}
                >
                  {opt.label}
                </Text>
                {isActive && (
                  <Ionicons name="checkmark" size={22} color="#1DB954" />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </View>
    </Modal>
  );
}
