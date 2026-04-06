/**
 * LyricsCard.tsx
 * Time-synced lyrics card shown in the expanded player.
 *
 * Features:
 * - Fetches lyrics: DB first → LRCLIB fallback
 * - Parses LRC (timestamped) and plain text lyrics
 * - Active line tracks playback position via PlayerPositionContext
 * - Auto-scrolls to keep active line centred in full-screen view
 * - Tap any line to seek to that timestamp
 * - Card preview shows 4 lines around the active one
 * - Animated opacity + scale transitions per line
 * - Source badge ("LRCLIB") shown when lyrics come from external API
 */

import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { usePlayerPosition } from "@/context/PlayerPositionContext";
import { fetchLyrics } from "@/services/lyrics";
import { getActiveLyricIndex, LyricLine, parseLrc } from "@/utils/lrcParser";
import { LinearGradient } from "expo-linear-gradient";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

// Fixed line height used for scroll position math
const LINE_HEIGHT = 58;
// Lines shown in the card preview
const PREVIEW_LINES = 4;
// Vertical offset — active line sits at ~35% from top of screen
const ACTIVE_LINE_OFFSET = SCREEN_H * 0.32;

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { bgColor: string };

type LyricsState =
  | { status: "loading" }
  | { status: "empty" }
  | {
      status: "ready";
      lines: LyricLine[];
      source: "database" | "lrclib" | "none";
    };

// ─── Animated lyric line ──────────────────────────────────────────────────────

const LyricLineView = React.memo(
  function LyricLineView({
    text,
    isActive,
    onPress,
    fontSize = 17,
  }: {
    text: string;
    isActive: boolean;
    onPress?: () => void;
    fontSize?: number;
  }) {
    const opacity = useRef(new Animated.Value(isActive ? 1 : 0.32)).current;
    const scale = useRef(new Animated.Value(isActive ? 1 : 0.96)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: isActive ? 1 : 0.32,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: isActive ? 1 : 0.96,
          duration: 380,
          useNativeDriver: true,
        }),
      ]).start();
    }, [isActive]);

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.65 : 1}
        disabled={!onPress}
        style={{ height: LINE_HEIGHT, justifyContent: "center" }}
      >
        <Animated.Text
          style={{
            opacity,
            transform: [{ scale }],
            color: "#fff",
            fontSize,
            fontFamily: "CircularStd",
            fontWeight: isActive ? "600" : "500",
            lineHeight: fontSize * 1.45,
          }}
        >
          {text || "♪"}
        </Animated.Text>
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.isActive === next.isActive &&
    prev.text === next.text &&
    prev.fontSize === next.fontSize,
);

// ─── Full-screen lyrics modal ─────────────────────────────────────────────────

function FullLyricsModal({
  visible,
  onClose,
  lines,
  activeIndex,
  onSeek,
  songTitle,
  artistName,
  source,
}: {
  visible: boolean;
  onClose: () => void;
  lines: LyricLine[];
  activeIndex: number;
  onSeek: (ms: number) => void;
  songTitle: string;
  artistName: string;
  source: "database" | "lrclib" | "none";
}) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(30)).current;
  const prevActiveRef = useRef(-1);
  // Track whether we've done the initial scroll after open
  const didInitialScrollRef = useRef(false);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      didInitialScrollRef.current = false;
      prevActiveRef.current = -1;
      Animated.parallel([
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(sheetY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(sheetY, {
          toValue: 30,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Auto-scroll to active line
  useEffect(() => {
    if (!visible || activeIndex < 0) return;
    if (activeIndex === prevActiveRef.current) return;
    prevActiveRef.current = activeIndex;

    const targetY = Math.max(0, activeIndex * LINE_HEIGHT - ACTIVE_LINE_OFFSET);
    const animated = didInitialScrollRef.current;
    didInitialScrollRef.current = true;

    // Small delay on first scroll so the modal has rendered
    const delay = animated ? 0 : 350;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: targetY, animated });
    }, delay);
    return () => clearTimeout(timer);
  }, [activeIndex, visible]);

  const isSynced = lines.some((l) => l.time > 0);

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "#0d0d0d",
          opacity: sheetOpacity,
          transform: [{ translateY: sheetY }],
        }}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 14,
            paddingHorizontal: 20,
            paddingBottom: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderBottomColor: "#1e1e1e",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                color: "#fff",
                fontSize: 15,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              {songTitle}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 3,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: "#a7a7a7",
                  fontSize: 13,
                  fontFamily: "CircularStd",
                }}
              >
                {artistName}
              </Text>
              {source === "lrclib" && (
                <View
                  style={{
                    backgroundColor: "#1a1a1a",
                    borderRadius: 4,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderWidth: 1,
                    borderColor: "#2a2a2a",
                  }}
                >
                  <Text
                    style={{
                      color: "#535353",
                      fontSize: 10,
                      fontFamily: "CircularStd",
                      fontWeight: "600",
                      letterSpacing: 0.5,
                    }}
                  >
                    LRCLIB
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={{
              backgroundColor: "#2a2a2a",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              marginLeft: 12,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 13,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              Close
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lyrics scroll */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: insets.bottom + SCREEN_H * 0.45,
          }}
        >
          {lines.map((line, i) => (
            <LyricLineView
              key={i}
              text={line.text}
              isActive={i === activeIndex}
              fontSize={21}
              onPress={isSynced ? () => onSeek(line.time) : undefined}
            />
          ))}
        </ScrollView>

        {/* Bottom gradient */}
        <LinearGradient
          colors={["transparent", "#0d0d0d"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 140,
            pointerEvents: "none",
          }}
        />
      </Animated.View>
    </Modal>
  );
}

// ─── Main LyricsCard ──────────────────────────────────────────────────────────

export const LyricsCard = React.memo(function LyricsCard({ bgColor }: Props) {
  const { currentSong, seekTo } = useMusicPlayer();
  const { position } = usePlayerPosition();

  const [lyricsState, setLyricsState] = useState<LyricsState>({
    status: "loading",
  });
  const [showFull, setShowFull] = useState(false);

  // ── Fetch lyrics when song changes ──────────────────────────────────────────

  useEffect(() => {
    if (!currentSong) {
      setLyricsState({ status: "empty" });
      return;
    }

    setLyricsState({ status: "loading" });
    setShowFull(false);

    const artistName =
      currentSong.artist_name ||
      currentSong.artists?.map((a) => a.name).join(", ") ||
      "";

    fetchLyrics({
      songId: currentSong.id,
      trackName: currentSong.title,
      artistName,
      albumName: currentSong.album_title ?? undefined,
      durationMs: currentSong.duration_ms ?? undefined,
    }).then(({ lrc, source }) => {
      const lines = parseLrc(lrc);
      if (lines.length === 0) {
        setLyricsState({ status: "empty" });
      } else {
        setLyricsState({ status: "ready", lines, source });
      }
    });
  }, [currentSong?.id]);

  // ── Active line index ────────────────────────────────────────────────────────

  const activeIndex = useMemo(() => {
    if (lyricsState.status !== "ready") return -1;
    return getActiveLyricIndex(lyricsState.lines, position);
  }, [lyricsState, position]);

  const handleSeek = useCallback((ms: number) => seekTo(ms), [seekTo]);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (lyricsState.status === "loading") {
    return (
      <View style={{ borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
        <LinearGradient
          colors={[bgColor, `${bgColor}cc`, `${bgColor}88`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={{ padding: 20, minHeight: 100, justifyContent: "center" }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 14,
              fontFamily: "CircularStd",
            }}
          >
            Loading lyrics...
          </Text>
        </LinearGradient>
      </View>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────

  if (lyricsState.status === "empty") {
    return (
      <View style={{ borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
        <LinearGradient
          colors={[bgColor, `${bgColor}cc`, `${bgColor}88`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={{ padding: 20, minHeight: 90, justifyContent: "center" }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 15,
              fontFamily: "CircularStd",
              fontWeight: "500",
            }}
          >
            No lyrics available
          </Text>
        </LinearGradient>
      </View>
    );
  }

  // ── Ready ────────────────────────────────────────────────────────────────────

  const { lines, source } = lyricsState;
  const isSynced = lines.some((l) => l.time > 0);

  // Preview window: show lines around the active one
  const windowStart = Math.max(0, activeIndex - 1);
  const previewLines = lines.slice(windowStart, windowStart + PREVIEW_LINES);

  const artistName =
    currentSong?.artist_name ||
    currentSong?.artists?.map((a) => a.name).join(", ") ||
    "";

  return (
    <>
      {/* ── Card preview ── */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => setShowFull(true)}
        style={{ borderRadius: 16, overflow: "hidden", marginBottom: 16 }}
      >
        <LinearGradient
          colors={[bgColor, `${bgColor}cc`, `${bgColor}88`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={{ padding: 20 }}
        >
          {/* Card header row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 12,
                fontFamily: "CircularStd",
                fontWeight: "600",
                letterSpacing: 1,
                opacity: 0.7,
                textTransform: "uppercase",
              }}
            >
              Lyrics
            </Text>
            {!isSynced && (
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderRadius: 4,
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 10,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                    letterSpacing: 0.5,
                  }}
                >
                  PLAIN TEXT
                </Text>
              </View>
            )}
          </View>

          {/* Preview lines */}
          {previewLines.map((line, i) => {
            const globalIndex = windowStart + i;
            return (
              <LyricLineView
                key={globalIndex}
                text={line.text}
                isActive={globalIndex === activeIndex}
                fontSize={17}
              />
            );
          })}

          {/* Show lyrics button */}
          <TouchableOpacity
            onPress={() => setShowFull(true)}
            activeOpacity={0.85}
            style={{
              backgroundColor: "rgba(255,255,255,0.14)",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 50,
              alignSelf: "flex-start",
              marginTop: 14,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 13,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              Show lyrics
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Full-screen modal ── */}
      <FullLyricsModal
        visible={showFull}
        onClose={() => setShowFull(false)}
        lines={lines}
        activeIndex={activeIndex}
        onSeek={handleSeek}
        songTitle={currentSong?.title ?? ""}
        artistName={artistName}
        source={source}
      />
    </>
  );
});
