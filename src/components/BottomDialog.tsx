import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  dismissLabel?: string;
  onConfirm: () => void;
  onDismiss: () => void;
};

export default function BottomDialog({
  visible,
  title,
  description,
  confirmLabel = "Continue",
  dismissLabel = "Dismiss",
  onConfirm,
  onDismiss,
}: Props) {
  const translateY = useRef(new Animated.Value(300)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
            speed: 18,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Fade out on close
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
        translateY.setValue(300);
        backdropOpacity.setValue(0);
        contentOpacity.setValue(0);
      });
    }
  }, [visible]);

  return (
    <Modal
      transparent
      animationType="none"
      visible={modalVisible}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onDismiss}>
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

      {/* Dialog panel */}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <Animated.View
          style={{
            width: "100%",
            backgroundColor: "#ffffff",
            borderRadius: 20,
            paddingHorizontal: 28,
            paddingTop: 32,
            paddingBottom: 28,
            alignItems: "center",
            transform: [{ translateY }],
            opacity: contentOpacity,
          }}
        >
          <Text
            style={{
              color: "#121212",
              fontSize: 20,
              fontWeight: "600",
              fontFamily: "CircularStd",
              textAlign: "center",
              marginBottom: 14,
            }}
          >
            {title}
          </Text>

          <Text
            style={{
              color: "#535353",
              fontSize: 14,
              fontFamily: "CircularStd",
              textAlign: "center",
              lineHeight: 20,
              marginBottom: 28,
            }}
          >
            {description}
          </Text>

          {/* Confirm button */}
          <TouchableOpacity
            onPress={onConfirm}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#1DB954",
              borderRadius: 50,
              paddingVertical: 12,
              paddingHorizontal: 38,
              alignItems: "center",
              width: "auto",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: "#000000",
                fontSize: 16,
                fontWeight: "600",
                fontFamily: "CircularStd",
              }}
            >
              {confirmLabel}
            </Text>
          </TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.7}
            style={{ paddingVertical: 8 }}
          >
            <Text
              style={{
                color: "#121212",
                fontSize: 16,
                fontWeight: "600",
                fontFamily: "CircularStd",
              }}
            >
              {dismissLabel}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
