/**
 * SongShareSheet
 *
 * Spotify-style share bottom sheet.
 * Card background uses the same color as the expanded player —
 * derived via usePlayerColor (hash-based from the image URL).
 * Three theme dots = the player color / darker variant / darkest variant.
 */

import { usePlayerColor } from "@/hooks/usePlayerColor";
import { fetchLyrics } from "@/services/lyrics";
import { parseLrc } from "@/utils/lrcParser";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Clipboard,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { toast } from "sonner-native";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const DISMISS_THRESHOLD = 100;

// ─── Color helpers ─────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const c = hex.replace("#", "");
  if (c.length !== 6) return null;
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const c = (v: number) => 
    Math.max(0, Math.min(255, Math.round(v * 255)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(f(0))}${c(f(8))}${c(f(4))}`;
}

function deriveThemes(playerColor: string): { bg: string; text: string }[] {
  const rgb = hexToRgb(playerColor);
  if (!rgb) {
    return [
      { bg: playerColor, text: "#ffffff" },
      { bg: "#1a1a1a", text: "#ffffff" },
      { bg: "#121212", text: "#ffffff" },
    ];
  }
  const [h, s] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  const hDeg = h * 360;
  const sPct = s * 100;
  return [
    { bg: playerColor, text: "#ffffff" }, // exact player color
    { bg: hslToHex(hDeg, sPct * 0.8, 18), text: "#ffffff" }, // darker
  ];
}

type Props = {
  visible: boolean;
  onClose: () => void;
  songTitle: string;
  artistName: string;
  imageUrl: string | null;
  songId?: string | null;
  albumTitle?: string;
  durationMs?: number;
};

// ─── Card dimensions ───────────────────────────────────────────────────────────

const CARD_W = SCREEN_W * 0.62;
const CARD_H = CARD_W * 1.45;
const PADDING = 12;

// ─── Artwork Card ───────────────────────────────────────────────────────────────

function ArtworkCard({
  songTitle,
  artistName,
  imageUrl,
  bgColor,
}: {
  songTitle: string;
  artistName: string;
  imageUrl: string | null;
  bgColor: string;
}) {
  return (
    <View
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: 16,
        backgroundColor: bgColor,
        padding: PADDING,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
        overflow: "hidden",
      }}
    >
      {/* Artwork - 65% of card height */}
      <View
        style={{
          height: CARD_H * 0.65,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "#1a1a1a",
        }}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#2a2a2a",
            }}
          >
            <Ionicons name="musical-note" size={48} color="#535353" />
          </View>
        )}
      </View>

      {/* Dark info section below artwork */}
      <View
        style={{
          marginTop: 10,
          backgroundColor: "rgba(0,0,0,0.4)",
          borderRadius: 10,
          padding: 12,
        }}
      >
        <Text
          style={{
            color: "#ffffff",
            fontFamily: "CircularStd",
            fontSize: 15,
            fontWeight: "600",
            marginBottom: 3,
          }}
          numberOfLines={1}
        >
          {songTitle}
        </Text>

        <Text
          style={{
            color: "rgba(255,255,255,0.7)",
            fontFamily: "CircularStd",
            fontSize: 12,
            marginBottom: 10,
          }}
          numberOfLines={1}
        >
          {artistName}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Image
            source={require("@/assets/images/logo-white.png")}
            style={{ width: 16, height: 16 }}
            contentFit="contain"
          />
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 11,
              fontWeight: "600",
            }}
          >
            Streambeat
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Lyrics Card ────────────────────────────────────────────────────────────────

function LyricsCard({
  songTitle,
  artistName,
  imageUrl,
  bgColor,
  lyricLines,
}: {
  songTitle: string;
  artistName: string;
  imageUrl: string | null;
  bgColor: string;
  lyricLines: string[];
}) {
  const displayText = lyricLines.length > 0
    ? lyricLines.slice(0, 2).join("\n")
    : "No lyrics available";

  return (
    <View
      style={{
        width: CARD_W + 30,
        height: CARD_H,
        borderRadius: 16,
        backgroundColor: bgColor,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
        overflow: "hidden",
      }}
    >
      {/* Top section with artwork thumbnail and song info */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        {/* Small artwork thumbnail */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 4,
            overflow: "hidden",
            backgroundColor: "#1a1a1a",
          }}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="musical-note" size={18} color="#535353" />
            </View>
          )}
        </View>

        {/* Song info */}
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 13,
              fontWeight: "600",
            }}
            numberOfLines={1}
          >
            {songTitle}
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontFamily: "CircularStd",
              fontSize: 11,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            Song · {artistName}
          </Text>
        </View>
      </View>

      {/* Large lyrics text */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <Text
          style={{
            color: "#ffffff",
            fontFamily: "CircularStd",
            fontSize: 28,
            fontWeight: "600",
            lineHeight: 42,
          }}
          numberOfLines={4}
        >
          {displayText}...
        </Text>
      </View>

      {/* Spotify logo at bottom */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Image
          source={require("@/assets/images/logo-white.png")}
          style={{ width: 16, height: 16 }}
          contentFit="contain"
        />
        <Text
          style={{
            color: "#ffffff",
            fontFamily: "CircularStd",
            fontSize: 11,
            fontWeight: "600",
          }}
        >
          Streambeat
        </Text>
      </View>
    </View>
  );
}

// ─── Action button ─────────────────────────────────────────────────────────────

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{ alignItems: "center", gap: 8 }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#2a2a2a",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          color: "#ffffff",
          fontFamily: "CircularStd",
          fontSize: 12,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main sheet ────────────────────────────────────────────────────────────────

export default function SongShareSheet({
  visible,
  onClose,
  songTitle,
  artistName,
  imageUrl,
  songId,
  albumTitle,
  durationMs,
}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTheme, setActiveTheme] = useState(0);
  const [activeMode, setActiveMode] = useState<"artwork" | "lyrics">("artwork");
  const [lyricLines, setLyricLines] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrollingRef = useRef(false);

  // Same color derivation as the expanded player
  const playerColor = usePlayerColor(imageUrl);
  const themes = deriveThemes(playerColor);

  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // Card mode snap interval (card width + gap)
  const CARD_GAP = 20;
  const SNAP_INTERVAL = CARD_W + CARD_GAP + 30; // +30 for wider lyrics card
  const SIDE_MARGIN = (SCREEN_W - CARD_W - 30) / 2;

  // Ref to capture the card for sharing
  const cardRef = useRef<View>(null);
  const [isCapturing, setIsCapturing] = useState(false);

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
    if (visible) {
      animateIn();
    } else {
      animateOut();
    }
  }, [visible]);

  // PanResponder for drag-to-close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, gs) => Math.abs(gs.dy) > 4,
      onPanResponderGrant: () => {
        dragY.setValue(0);
      },
      onPanResponderMove: (_e, gs) => {
        if (gs.dy > 0) {
          // Only allow dragging down
          translateY.setValue(Math.min(gs.dy, SCREEN_H));
          // Fade backdrop
          backdropOpacity.setValue(
            1 - Math.min(gs.dy / DISMISS_THRESHOLD, 1) * 0.6,
          );
        }
      },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dy > DISMISS_THRESHOLD || gs.vy > 0.5) {
          // Dismiss
          animateOut(() => {
            dragY.setValue(0);
            onClose();
          });
        } else {
          // Snap back
          snapTo(0);
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const combinedTranslateY = Animated.add(translateY, dragY);

  const shareUrl = `https://streambeat.app/song/${songId ?? ""}`;

  // Capture the card as an image
  const captureCard = useCallback(async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    try {
      setIsCapturing(true);
      const uri = await captureRef(cardRef.current, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      return uri;
    } catch (error) {
      console.error("Failed to capture card:", error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Copy link to clipboard
  const handleCopyLink = useCallback(async () => {
    Clipboard.setString(shareUrl);
    toast.success("Link copied to clipboard");
    onClose();
  }, [shareUrl, onClose]);

  // Share to Instagram Stories
  const handleInstagramStories = useCallback(async () => {
    const uri = await captureCard();
    if (!uri) {
      toast.error("Failed to create share image");
      return;
    }

    try {
      // Instagram Stories sharing via URL scheme (iOS)
      if (Platform.OS === "ios") {
        const instagramUrl = `instagram-stories://share`;
        const canOpen = await Linking.canOpenURL(instagramUrl);
        if (canOpen) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            UTI: "public.png",
            dialogTitle: "Share to Instagram Stories",
          });
        } else {
          // Fallback to generic share
          await Sharing.shareAsync(uri);
        }
      } else {
        // Android - use generic share
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share to Instagram Stories",
        });
      }
    } catch (error) {
      console.error("Instagram share error:", error);
      // Fallback to system share
      await Sharing.shareAsync(uri);
    }
    onClose();
  }, [captureCard, onClose]);

  // Share to WhatsApp (image + caption text)
  const handleWhatsApp = useCallback(async () => {
    const uri = await captureCard();
    const text = `${songTitle} by ${artistName}\n\n${shareUrl}`;

    if (!uri) {
      // Fallback to text-only if capture fails
      try {
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
        } else {
          await Share.share({ message: text });
        }
      } catch (error) {
        await Share.share({ message: text });
      }
      onClose();
      return;
    }

    // Copy text to clipboard so user can paste as caption
    Clipboard.setString(text);
    toast.success("Caption copied - paste in WhatsApp");

    try {
      // Share just the image - user can paste caption
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share to WhatsApp",
        UTI: "public.png",
      });
    } catch (error) {
      console.error("WhatsApp share error:", error);
      // Fallback to system share
      await Share.share({
        message: text,
        url: uri,
      });
    }
    onClose();
  }, [captureCard, songTitle, artistName, shareUrl, onClose]);

  // Native system share with image
  const handleMore = useCallback(async () => {
    const uri = await captureCard();
    if (uri) {
      try {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: `Share ${songTitle}`,
        });
      } catch (error) {
        // Fallback to text-only share
        await Share.share({
          title: songTitle,
          message: `${songTitle} by ${artistName}\n\n${shareUrl}`,
          url: shareUrl,
        });
      }
    } else {
      // Text-only fallback
      await Share.share({
        title: songTitle,
        message: `${songTitle} by ${artistName}\n\n${shareUrl}`,
        url: shareUrl,
      });
    }
    onClose();
  }, [captureCard, songTitle, artistName, shareUrl, onClose]);

  // Fetch lyrics when visible
  useEffect(() => {
    if (visible && songId) {
      fetchLyrics({
        songId,
        trackName: songTitle,
        artistName: artistName,
        albumName: albumTitle,
        durationMs,
      }).then((result) => {
        if (result.lrc) {
          const lines = parseLrc(result.lrc);
          const texts = lines.map((l) => l.text).filter((t) => t.trim());
          setLyricLines(texts.slice(0, 2));
        } else {
          setLyricLines([]);
        }
      });
    }
  }, [visible, songId, songTitle, artistName, albumTitle, durationMs]);

  // Handle scroll to switch between artwork and lyrics modes
  const handleScroll = useCallback((event: any) => {
    if (isScrollingRef.current) {
      const x = event.nativeEvent.contentOffset.x;
      const pageIndex = Math.round(x / SNAP_INTERVAL);
      const newMode = pageIndex === 0 ? "artwork" : "lyrics";
      if (newMode !== activeMode) {
        setActiveMode(newMode);
      }
    }
  }, [activeMode]);

  const handleScrollBegin = useCallback(() => {
    isScrollingRef.current = true;
  }, []);

  const handleScrollEnd = useCallback(() => {
    isScrollingRef.current = false;
  }, []);

  // Select theme - just changes background color
  const selectTheme = useCallback((index: number) => {
    setActiveTheme(index);
  }, []);

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
            backgroundColor: "#1e1e1e",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            paddingBottom: insets.bottom + 20,
            maxHeight: SCREEN_H * 0.85,
            transform: [{ translateY: combinedTranslateY }],
          }}
        >
          {/* Drag handle — always draggable */}
          <View
            {...panResponder.panHandlers}
            style={{ alignItems: "center", paddingTop: 10, paddingBottom: 20 }}
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

          {/* Card mode carousel (Artwork | Lyrics) */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SIDE_MARGIN,
            }}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBegin}
            onScrollEndDrag={handleScrollEnd}
            onMomentumScrollEnd={handleScrollEnd}
            scrollEventThrottle={16}
            style={{ marginBottom: 24 }}
          >
            {/* Artwork Mode Card - wrapped with capture ref */}
            <View
              ref={activeMode === "artwork" ? cardRef : null}
              style={{ marginRight: CARD_GAP }}
              collapsable={false}
            >
              <ArtworkCard
                songTitle={songTitle}
                artistName={artistName}
                imageUrl={imageUrl}
                bgColor={themes[activeTheme]?.bg ?? playerColor}
              />
            </View>

            {/* Lyrics Mode Card - wrapped with capture ref */}
            <View
              ref={activeMode === "lyrics" ? cardRef : null}
              collapsable={false}
            >
              <LyricsCard
                songTitle={songTitle}
                artistName={artistName}
                imageUrl={imageUrl}
                bgColor={themes[activeTheme]?.bg ?? playerColor}
                lyricLines={lyricLines}
              />
            </View>
          </ScrollView>

          {/* Theme dots - changes card background color */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            {themes.map((t, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => selectTheme(i)}
                activeOpacity={0.8}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: t.bg,
                  borderWidth: activeTheme === i ? 2.5 : 0,
                  borderColor: "#ffffff",
                }}
              />
            ))}
          </View>

          {/* Mode indicator dots */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              marginBottom: 28,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: activeMode === "artwork" ? "#ffffff" : "#535353",
              }}
            />
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: activeMode === "lyrics" ? "#ffffff" : "#535353",
              }}
            />
          </View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: "#2a2a2a",
              marginHorizontal: 20,
              marginBottom: 24,
            }}
          />

          {/* Action buttons - Spotify style */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              paddingHorizontal: 16,
            }}
          >
            <ActionButton
              icon={<Ionicons name="copy-outline" size={24} color="#ffffff" />}
              label="Copy Link"
              onPress={handleCopyLink}
            />
            <ActionButton
              icon={
                <Ionicons name="logo-instagram" size={24} color="#ffffff" />
              }
              label="Stories"
              onPress={handleInstagramStories}
            />
            <ActionButton
              icon={
                <Ionicons name="logo-whatsapp" size={24} color="#ffffff" />
              }
              label="WhatsApp"
              onPress={handleWhatsApp}
            />
            <ActionButton
              icon={
                <Ionicons name="ellipsis-horizontal" size={24} color="#ffffff" />
              }
              label="More"
              onPress={handleMore}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
