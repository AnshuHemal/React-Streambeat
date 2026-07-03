
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
import { FlatList } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_H } = Dimensions.get("window");

// Lines shown in the card preview
const PREVIEW_LINES = 4;
// Vertical offset for full-screen auto-scroll — active line at ~30% from top
const ACTIVE_LINE_OFFSET = SCREEN_H * 0.3;
// Approximate height per line in full-screen view (for scroll math)
const FULL_LINE_H = 64;

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

// ─── Card lyric line ──────────────────────────────────────────────────────────
// Stable component — never remounted, only isActive changes.
// opacity + scale on native thread = zero JS lag.

const CardLine = React.memo(
  function CardLine({
    text,
    isActive,
    isVisible,
  }: {
    text: string;
    isActive: boolean;
    isVisible: boolean;
  }) {
    const opacity = useRef(
      new Animated.Value(isActive ? 1 : isVisible ? 0.42 : 0),
    ).current;
    const scale = useRef(new Animated.Value(isActive ? 1 : 0.93)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: isActive ? 1 : isVisible ? 0.42 : 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: isActive ? 1 : isVisible ? 0.93 : 0.88,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: isVisible ? 0 : 8,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    }, [isActive, isVisible]);

    return (
      <Animated.Text
        style={{
          opacity,
          transform: [{ scale }],
          color: "#fff",
          fontSize: 20,
          fontFamily: "CircularStd",
          fontWeight: isActive ? "600" : "500",
          lineHeight: 28,
          marginBottom: 14,
        }}
        numberOfLines={2}
      >
        {text || "♪"}
      </Animated.Text>
    );
  },
  (prev, next) =>
    prev.isActive === next.isActive &&
    prev.isVisible === next.isVisible &&
    prev.text === next.text,
);

// ─── Full-screen lyric line ───────────────────────────────────────────────────

const FullLine = React.memo(
  function FullLine({
    text,
    isActive,
    onPress,
  }: {
    text: string;
    isActive: boolean;
    onPress?: () => void;
  }) {
    const opacity = useRef(new Animated.Value(isActive ? 1 : 0.38)).current;
    const scale = useRef(new Animated.Value(isActive ? 1 : 0.97)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: isActive ? 1 : 0.38,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: isActive ? 1 : 0.97,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }, [isActive]);

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.65 : 1}
        disabled={!onPress}
        style={{
          minHeight: FULL_LINE_H,
          justifyContent: "center",
          paddingVertical: 4,
        }}
      >
        <Animated.Text
          style={{
            opacity,
            transform: [{ scale }],
            color: "#fff",
            fontSize: isActive ? 24 : 20,
            fontFamily: "CircularStd",
            fontWeight: isActive ? "600" : "500",
            lineHeight: isActive ? 32 : 28,
          }}
        >
          {text || "♪"}
        </Animated.Text>
      </TouchableOpacity>
    );
  },
  (prev, next) => prev.isActive === next.isActive && prev.text === next.text,
);

// ─── Full-screen modal ────────────────────────────────────────────────────────

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
  const sheetY = useRef(new Animated.Value(24)).current;
  const prevActiveRef = useRef(-1);
  const didInitialScrollRef = useRef(false);

  useEffect(() => {
    if (visible) {
      didInitialScrollRef.current = false;
      prevActiveRef.current = -1;
      Animated.parallel([
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(sheetY, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetY, {
          toValue: 24,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || activeIndex < 0) return;
    if (activeIndex === prevActiveRef.current) return;
    prevActiveRef.current = activeIndex;

    const targetY = Math.max(0, activeIndex * FULL_LINE_H - ACTIVE_LINE_OFFSET);
    const isFirst = !didInitialScrollRef.current;
    didInitialScrollRef.current = true;

    const timer = setTimeout(
      () => scrollRef.current?.scrollTo({ y: targetY, animated: !isFirst }),
      isFirst ? 320 : 0,
    );
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
          opacity: sheetOpacity,
          transform: [{ translateY: sheetY }],
          backgroundColor: "#1e1e1e",
        }}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 14,
            paddingHorizontal: 24,
            paddingBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderBottomColor: "#2a2a2a",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                color: "#fff",
                fontSize: 16,
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
                    backgroundColor: "#2a2a2a",
                    borderRadius: 4,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
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

        {/* Lyrics */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: insets.bottom + 40,
          }}
        >
          {lines.map((line, i) => (
            <FullLine
              key={i}
              text={line.text}
              isActive={i === activeIndex}
              onPress={isSynced ? () => onSeek(line.time) : undefined}
            />
          ))}
        </ScrollView>

        {/* Bottom fade */}
        <LinearGradient
          colors={["transparent", "#1e1e1e"]}
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

  // Fetch lyrics when song changes
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
      setLyricsState(
        lines.length === 0
          ? { status: "empty" }
          : { status: "ready", lines, source },
      );
    });
  }, [currentSong?.id]);

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
              color: "rgba(255,255,255,0.45)",
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

  // Active line sits at slot index 3 (fourth position) in the preview window.
  // windowStart shifts so activeIndex always lands at slot 3.
  const ACTIVE_SLOT = 3;
  const windowStart = Math.max(0, activeIndex - ACTIVE_SLOT);
  // Always render exactly PREVIEW_LINES slots — stable keys prevent remounting
  const windowLines = Array.from({ length: PREVIEW_LINES }, (_, slot) => {
    const lineIndex = windowStart + slot;
    const line = lines[lineIndex];
    return {
      lineIndex,
      text: line?.text ?? "",
      isActive: lineIndex === activeIndex,
      isVisible: !!line,
    };
  });

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
          style={{ padding: 20, paddingBottom: 24 }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontFamily: "CircularStd",
              fontWeight: "600",
              marginBottom: 20,
            }}
          >
            Lyrics preview
          </Text>

          {/* Fixed PREVIEW_LINES slots — stable keys, no remounting */}
          {windowLines.map(({ lineIndex, text, isActive, isVisible }) => (
            <CardLine
              key={lineIndex}
              text={text}
              isActive={isActive}
              isVisible={isVisible}
            />
          ))}

          <TouchableOpacity
            onPress={() => setShowFull(true)}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#fff",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 50,
              alignSelf: "flex-start",
              marginTop: 20,
            }}
          >
            <Text
              style={{
                color: "#000",
                fontSize: 14,
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
