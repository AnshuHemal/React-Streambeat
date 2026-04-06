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

const { height: SCREEN_H } = Dimensions.get("window");
const DISMISS_THRESHOLD = 80;

type TimerOption = {
  label: string;
  minutes: number | "end_of_track";
};

const OPTIONS: TimerOption[] = [
  { label: "5 minutes", minutes: 5 },
  { label: "10 minutes", minutes: 10 },
  { label: "15 minutes", minutes: 15 },
  { label: "30 minutes", minutes: 30 },
  { label: "45 minutes", minutes: 45 },
  { label: "1 hour", minutes: 60 },
  { label: "End of track", minutes: "end_of_track" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: TimerOption) => void;
  activeMinutes?: number | "end_of_track" | null;
};

export function SleepTimerSheet({
  visible,
  onClose,
  onSelect,
  activeMinutes,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_H);
      dragY.setValue(0);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
          easing: (t) => 1 - Math.pow(1 - t, 3),
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
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
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, gs) => gs.dy > 4,
      onPanResponderGrant: () => {
        dragY.setValue(0);
      },
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
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: SCREEN_H,
              duration: 220,
              useNativeDriver: true,
              easing: (t) => t * t,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 180,
              useNativeDriver: true,
            }),
          ]).start(() => {
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

          {/* Title */}
          <View
            {...panResponder.panHandlers}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#2a2a2a",
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 17,
                fontFamily: "CircularStd",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              Sleep timer
            </Text>
          </View>

          {/* Options */}
          {OPTIONS.map((opt) => {
            const isActive = activeMinutes === opt.minutes;
            return (
              <TouchableOpacity
                key={String(opt.minutes)}
                activeOpacity={0.7}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
                style={{ paddingHorizontal: 20, paddingVertical: 18 }}
              >
                <Text
                  style={{
                    color: isActive ? "#1DB954" : "#ffffff",
                    fontSize: 16,
                    fontFamily: "CircularStd",
                    fontWeight: isActive ? "600" : "400",
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </View>
    </Modal>
  );
}
