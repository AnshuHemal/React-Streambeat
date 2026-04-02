import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W * 0.72;

// Simulated barcode bars — alternating widths to mimic a Spotify-style scan code
const BARS = [
  3, 1, 2, 1, 3, 2, 1, 3, 1, 2, 3, 1, 2, 1, 3, 1, 2, 3, 1, 2, 1, 3, 2, 1, 3, 1,
  2, 1, 3, 2,
];

type Props = {
  visible: boolean;
  onClose: () => void;
  songTitle: string;
  artistName: string;
  imageUrl: string | null;
};

export default function StreambeatCodeModal({
  visible,
  onClose,
  songTitle,
  artistName,
  imageUrl,
}: Props) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.88,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="#000000" barStyle="light-content" />

      {/* Full black background */}
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: "absolute",
            top: insets.top + 12,
            left: 20,
            zIndex: 10,
            padding: 4,
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={28} color="#ffffff" />
        </TouchableOpacity>

        {/* Centered card */}
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Animated.View style={{ transform: [{ scale }], opacity }}>
            <View
              style={{
                width: CARD_W,
                borderRadius: 8,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 16,
              }}
            >
              {/* Album art */}
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: CARD_W, height: CARD_W }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: CARD_W,
                    height: CARD_W,
                    backgroundColor: "#1e1e1e",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="musical-note" size={64} color="#535353" />
                </View>
              )}

              {/* Code bar — teal/cyan strip with logo + barcode */}
              <View
                style={{
                  backgroundColor: "#29B6D5",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {/* App logo */}
                <Image
                  source={require("@/assets/images/logo-white.png")}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />

                {/* Barcode bars */}
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    height: 40,
                    gap: 2,
                  }}
                >
                  {BARS.map((w, i) => (
                    <View
                      key={i}
                      style={{
                        width: w * 2,
                        // Vary bar heights to mimic Spotify's scan code wave pattern
                        height: 12 + ((i * 7 + w * 4) % 22),
                        backgroundColor: "#ffffff",
                        borderRadius: 5,
                      }}
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* Song info below card */}
            <View
              style={{
                alignItems: "center",
                marginTop: 24,
                paddingHorizontal: 16,
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 17,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                  textAlign: "center",
                  marginBottom: 6,
                }}
                numberOfLines={2}
              >
                {songTitle}
              </Text>
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 14,
                  fontFamily: "CircularStd",
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                {artistName}
              </Text>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
