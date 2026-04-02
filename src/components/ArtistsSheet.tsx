import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Image,
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

export type ArtistItem = {
  id: string;
  name: string;
  image_url: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  artists: ArtistItem[];
};

export default function ArtistsSheet({ visible, onClose, artists }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
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

  const combinedTranslateY = Animated.add(translateY, dragY);

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

      {/* Sheet */}
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View
          style={{
            backgroundColor: "#1a1a1a",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            paddingBottom: insets.bottom + 24,
            transform: [{ translateY: combinedTranslateY }],
          }}
        >
          {/* Drag handle + title — draggable */}
          <View {...panResponder.panHandlers}>
            {/* Handle bar */}
            <View
              style={{
                alignItems: "center",
                paddingTop: 10,
                paddingBottom: 16,
              }}
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
            <Text
              style={{
                color: "#ffffff",
                fontSize: 18,
                fontFamily: "CircularStd",
                fontWeight: "600",
                textAlign: "center",
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#2a2a2a",
              }}
            >
              Artists
            </Text>
          </View>

          {/* Artist list */}
          {artists.map((artist) => (
            <TouchableOpacity
              key={artist.id}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                router.push(`/artist/${artist.id}` as any);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 14,
              }}
            >
              {artist.image_url ? (
                <Image
                  source={{ uri: artist.image_url }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    marginRight: 16,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: "#2a2a2a",
                    marginRight: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="person" size={24} color="#535353" />
                </View>
              )}
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 16,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                }}
                numberOfLines={1}
              >
                {artist.name}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}
