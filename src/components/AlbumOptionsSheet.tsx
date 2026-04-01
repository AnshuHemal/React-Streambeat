import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_H } = Dimensions.get("window");
const DISMISS_THRESHOLD = 80; // px dragged down before auto-dismiss

type MenuItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: "premium";
  onPress?: () => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  albumTitle: string;
  artistNames: string;
  imageUrl: string | null;
};

const MENU_ITEMS: MenuItem[] = [
  { id: "share", icon: "share-social-outline", label: "Share" },
  {
    id: "ad-free",
    icon: "diamond-outline",
    label: "Listen to music ad-free",
    badge: "premium",
  },
  { id: "library", icon: "add-circle-outline", label: "Add to Your Library" },
  {
    id: "download",
    icon: "arrow-down-circle-outline",
    label: "Download",
    badge: "premium",
  },
  { id: "artist", icon: "person-outline", label: "Go to artist" },
  { id: "queue", icon: "list-outline", label: "Add to Queue" },
  { id: "radio", icon: "radio-outline", label: "Go to album radio" },
  { id: "playlist", icon: "add-circle-outline", label: "Add to playlist" },
  { id: "legal", icon: "help-circle-outline", label: "Legal disclosure" },
];

export default function AlbumOptionsSheet({
  visible,
  onClose,
  albumTitle,
  artistNames,
  imageUrl,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  // Tracks drag offset separately so we can combine with base translateY
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
    if (visible) {
      animateIn();
    } else {
      animateOut();
    }
  }, [visible]);

  // PanResponder for drag-to-dismiss on the handle / header area
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, gs) => gs.dy > 4, // only capture downward drags
      onPanResponderGrant: () => {
        dragY.setValue(0);
      },
      onPanResponderMove: (_e, gs) => {
        // Only allow dragging downward
        if (gs.dy > 0) {
          dragY.setValue(gs.dy);
          // Fade backdrop as user drags down
          const progress = Math.min(gs.dy / DISMISS_THRESHOLD, 1);
          backdropOpacity.setValue(1 - progress * 0.6);
        }
      },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dy > DISMISS_THRESHOLD || gs.vy > 0.5) {
          // Snap to close
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
          // Snap back to open position
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
            paddingBottom: insets.bottom + 16,
            maxHeight: SCREEN_H * 0.88,
            transform: [{ translateY: combinedTranslateY }],
          }}
        >
          {/* Draggable handle area */}
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

          {/* Album header — also draggable */}
          <View
            {...panResponder.panHandlers}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: "#2a2a2a",
              marginBottom: 4,
            }}
          >
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 4,
                  marginRight: 14,
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 4,
                  backgroundColor: "#2a2a2a",
                  marginRight: 14,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="disc" size={24} color="#535353" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 15,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                  marginBottom: 3,
                }}
                numberOfLines={1}
              >
                {albumTitle}
              </Text>
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 13,
                  fontFamily: "CircularStd",
                }}
                numberOfLines={1}
              >
                {artistNames}
              </Text>
            </View>
          </View>

          {/* Menu items */}
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.65}
                onPress={() => {
                  item.onPress?.();
                  onClose();
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={26}
                  color="#ffffff"
                  style={{ marginRight: 18 }}
                />
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    fontFamily: "CircularStd",
                    flex: 1,
                  }}
                >
                  {item.label}
                </Text>
                {item.badge === "premium" && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderRadius: 4,
                      paddingHorizontal: 6,
                      paddingVertical: 3,
                      gap: 4,
                    }}
                  >
                    <Image
                      source={require("@/assets/images/logo.png")}
                      style={{ width: 14, height: 14, tintColor: "#1DB954" }}
                      resizeMode="contain"
                    />
                    <Text
                      style={{
                        color: "#1DB954",
                        fontSize: 12,
                        fontFamily: "CircularStd",
                        fontWeight: "600",
                      }}
                    >
                      Premium
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
