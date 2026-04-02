import ArtistsSheet, { ArtistItem } from "@/components/ArtistsSheet";
import StreambeatCodeModal from "@/components/StreambeatCodeModal";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
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
const DISMISS_THRESHOLD = 100;
// Sheet snaps between these two positions (as translateY from bottom)
const HALF_POSITION = SCREEN_H * 0.48; // half screen
const FULL_POSITION = 0; // full height (maxHeight caps it)

type MenuItem = {
  id: string;
  icon?: keyof typeof Ionicons.glyphMap;
  customImage?: any; // for local require() images
  label: string;
  badge?: "premium";
  iconBg?: string;
  onPress?: () => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  songTitle: string;
  artistName: string;
  albumTitle: string;
  imageUrl: string | null;
  artists?: ArtistItem[];
};

const MENU_ITEMS: MenuItem[] = [
  { id: "share", icon: "share-social-outline", label: "Share" },
  {
    id: "liked",
    icon: undefined,
    label: "Add to Liked Songs",
    customImage: require("@/assets/images/liked-placeholder.png"),
  },
  { id: "playlist", icon: "add-circle-outline", label: "Add to playlist" },
  { id: "hide", icon: "close-outline", label: "Hide in this album" },
  {
    id: "ad-free",
    icon: "diamond-outline",
    label: "Listen to music ad-free",
    badge: "premium",
  },
  { id: "add-queue", icon: "add-outline", label: "Add to Queue" },
  { id: "go-queue", icon: "reorder-three-outline", label: "Go to Queue" },
  { id: "go-artist", icon: "people-outline", label: "Go to artists" },
  {
    id: "jam",
    icon: "people-circle-outline",
    label: "Start a Jam",
    badge: "premium",
  },
  {
    id: "exclude",
    icon: "close-circle-outline",
    label: "Exclude track from your taste profile",
  },
  { id: "radio", icon: "radio-outline", label: "Go to song radio" },
  { id: "credits", icon: "document-text-outline", label: "View song credits" },
  { id: "code", icon: "barcode-outline", label: "Show Streambeat Code" },
];

export default function SongOptionsSheet({
  visible,
  onClose,
  songTitle,
  artistName,
  albumTitle,
  imageUrl,
  artists = [],
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const currentSnap = useRef<"half" | "full">("half");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showArtists, setShowArtists] = useState(false);

  const snapTo = (position: number, callback?: () => void) => {
    Animated.spring(translateY, {
      toValue: position,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => callback?.());
  };

  const animateIn = () => {
    translateY.setValue(SCREEN_H);
    dragY.setValue(0);
    backdropOpacity.setValue(0);
    currentSnap.current = "half";
    setIsExpanded(false);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: HALF_POSITION,
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
      onMoveShouldSetPanResponder: (_e, gs) => Math.abs(gs.dy) > 4,
      onPanResponderGrant: () => {
        dragY.setValue(0);
      },
      onPanResponderMove: (_e, gs) => {
        const base =
          currentSnap.current === "half" ? HALF_POSITION : FULL_POSITION;
        const next = base + gs.dy;
        // Allow drag in both directions but clamp: can't go above full, can't go too far below
        if (next >= FULL_POSITION) {
          translateY.setValue(Math.min(next, SCREEN_H));
          // Fade backdrop when dragging down from half
          if (gs.dy > 0 && currentSnap.current === "half") {
            backdropOpacity.setValue(
              1 - Math.min(gs.dy / DISMISS_THRESHOLD, 1) * 0.6,
            );
          }
        }
      },
      onPanResponderRelease: (_e, gs) => {
        const base =
          currentSnap.current === "half" ? HALF_POSITION : FULL_POSITION;

        if (currentSnap.current === "half") {
          if (gs.dy < -60 || gs.vy < -0.5) {
            // Drag up from half → expand to full
            currentSnap.current = "full";
            setIsExpanded(true);
            snapTo(FULL_POSITION);
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }).start();
          } else if (gs.dy > DISMISS_THRESHOLD || gs.vy > 0.5) {
            // Drag down from half → dismiss
            animateOut(() => {
              dragY.setValue(0);
              onClose();
            });
          } else {
            // Snap back to half
            snapTo(HALF_POSITION);
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }).start();
          }
        } else {
          // Currently full
          if (gs.dy > DISMISS_THRESHOLD || gs.vy > 0.5) {
            // Drag down from full → dismiss directly (skip half snap)
            animateOut(() => {
              dragY.setValue(0);
              onClose();
            });
          } else {
            // Small drag → snap back to full
            snapTo(FULL_POSITION);
          }
        }
      },
    }),
  ).current;

  const combinedTranslateY = Animated.add(translateY, dragY);

  return (
    <>
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
              maxHeight: SCREEN_H * 0.92,
              transform: [{ translateY: combinedTranslateY }],
            }}
          >
            {/* Drag handle — always draggable */}
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

            {/* Song header — also draggable */}
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
                  <Ionicons name="musical-note" size={24} color="#535353" />
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
                  {songTitle}
                </Text>
                <Text
                  style={{
                    color: "#a7a7a7",
                    fontSize: 13,
                    fontFamily: "CircularStd",
                  }}
                  numberOfLines={1}
                >
                  {artistName} • {albumTitle}
                </Text>
              </View>
            </View>

            {/* Scrollable menu — scrolling up expands the sheet */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              scrollEnabled={isExpanded}
              onScrollBeginDrag={() => {
                // When user starts scrolling up in half mode, expand to full
                if (currentSnap.current === "half") {
                  currentSnap.current = "full";
                  setIsExpanded(true);
                  snapTo(FULL_POSITION);
                }
              }}
            >
              {MENU_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.65}
                  onPress={() => {
                    if (item.id === "code") {
                      animateOut(() => {
                        dragY.setValue(0);
                        onClose();
                        setShowCode(true);
                      });
                      return;
                    }
                    if (item.id === "go-artist") {
                      animateOut(() => {
                        dragY.setValue(0);
                        onClose();
                        setShowArtists(true);
                      });
                      return;
                    }
                    item.onPress?.();
                    onClose();
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 20,
                    paddingVertical: 15,
                  }}
                >
                  {item.customImage && !item.iconBg ? (
                    // Custom image with no background — render at icon size
                    <Image
                      source={item.customImage}
                      style={{ width: 34, height: 34, marginRight: 18 }}
                      resizeMode="contain"
                    />
                  ) : item.iconBg ? (
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 6,
                        backgroundColor: item.iconBg,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 18,
                      }}
                    >
                      {item.customImage ? (
                        <Image
                          source={item.customImage}
                          style={{ width: 22, height: 22 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons name={item.icon!} size={18} color="#ffffff" />
                      )}
                    </View>
                  ) : (
                    <Ionicons
                      name={item.icon!}
                      size={24}
                      color="#e3e3e3"
                      style={{
                        marginRight: 18,
                        width: 34,
                        textAlign: "center",
                      }}
                    />
                  )}

                  <Text
                    style={{
                      color: "#e3e3e3",
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

      <StreambeatCodeModal
        visible={showCode}
        onClose={() => setShowCode(false)}
        songTitle={songTitle}
        artistName={artistName}
        imageUrl={imageUrl}
      />
      <ArtistsSheet
        visible={showArtists}
        onClose={() => setShowArtists(false)}
        artists={artists}
      />
    </>
  );
}
