import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

export type SortOption = "recents" | "recently_added" | "alphabetical" | "creator";

type Props = {
  visible: boolean;
  selected: SortOption;
  onSelect: (option: SortOption) => void;
  onClose: () => void;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recents", label: "Recents" },
  { value: "recently_added", label: "Recently added" },
  { value: "alphabetical", label: "Alphabetical" },
  { value: "creator", label: "Creator" },
];

const { height: SCREEN_H } = Dimensions.get("window");

export default function SortBottomSheet({
  visible,
  selected,
  onSelect,
  onClose,
}: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up entry animation
      translateY.setValue(SCREEN_H);
      sheetOpacity.setValue(0);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: (x) => {
            // Cubic bezier ease-out curve for smooth deceleration
            return 1 - Math.pow(1 - x, 3);
          },
        }),
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down exit animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_H,
          duration: 250,
          useNativeDriver: true,
          easing: (x) => {
            // Cubic bezier ease-in curve for acceleration when exiting
            return x * x * x;
          },
        }),
        Animated.timing(sheetOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSelect = (option: SortOption) => {
    onSelect(option);
    onClose();
  };

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
            backgroundColor: "rgba(0,0,0,0.5)",
            opacity: backdropOpacity,
          }}
        />
      </TouchableWithoutFeedback>

      {/* Bottom Sheet */}
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
        }}
      >
        <Animated.View
          style={{
            backgroundColor: "#1e1e1e",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingBottom: 34,
            opacity: sheetOpacity,
            transform: [{ translateY }],
          }}
        >
          {/* Handle bar */}
          <View
            style={{
              alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "#535353",
                borderRadius: 2,
              }}
            />
          </View>

          {/* Title */}
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "700",
              fontFamily: "CircularStd",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            Sort by
          </Text>

          {/* Options */}
          {SORT_OPTIONS.map((option) => {
            const isSelected = selected === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleSelect(option.value)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    fontWeight: isSelected ? "600" : "400",
                    fontFamily: "CircularStd",
                  }}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <Image
                    source={require("@/assets/images/icon-check.png")}
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </View>
    </Modal>
  );
}
