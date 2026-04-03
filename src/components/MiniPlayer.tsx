import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { useBluetoothDevice } from "@/hooks/useAudioDevice";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MINI_PLAYER_HEIGHT = 64;

// Separate component for progress bar to avoid re-rendering entire MiniPlayer
const ProgressBar = React.memo(function ProgressBar() {
  const { position, duration } = useMusicPlayer();
  
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  };
  
  return (
    <>
      <View style={{ marginBottom: 8 }}>
        <View
          style={{
            height: 4,
            backgroundColor: "rgba(255,255,255,0.3)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              backgroundColor: "#fff",
              borderRadius: 2,
            }}
          />
        </View>
        <View
          style={{
            position: "absolute",
            left: `${progressPercent}%`,
            top: -3,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "#fff",
            marginLeft: -5,
            opacity: progressPercent > 0 ? 1 : 0,
          }}
        />
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <Text
          style={{
            color: "#B3B3B3",
            fontSize: 12,
            fontFamily: "CircularStd",
          }}
        >
          {formatTime(position)}
        </Text>
        <Text
          style={{
            color: "#B3B3B3",
            fontSize: 12,
            fontFamily: "CircularStd",
          }}
        >
          {formatTime(duration)}
        </Text>
      </View>
    </>
  );
});

// Mini player progress bar for collapsed view
const MiniPlayerProgress = React.memo(function MiniPlayerProgress() {
  const { position, duration } = useMusicPlayer();
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  
  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 12,
        right: 12,
        height: 2,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${progressPercent}%`,
          height: "100%",
          backgroundColor: "#fff",
        }}
      />
    </View>
  );
});

// Karaoke-style animated lyrics component
const LyricsAnimation = React.memo(function LyricsAnimation() {
  const lyrics = [
    "Hm, jaanaa, too aathaa nahin",
    "saponon se jaataa nahin",
    "mil jae, kya hee baath thi",
    "kamil ho jaataa vaheen",
    "jaanaa, mere savaalon ka\nmanzar too",
  ];
  
  // Create animated values directly - ensure they exist
  const scaleAnims = useRef(lyrics.map(() => new Animated.Value(1))).current;
  const opacityAnims = useRef(lyrics.map(() => new Animated.Value(0.6))).current;
  
  const [activeIndex, setActiveIndex] = useState(0);
  
  useEffect(() => {
    const animateLine = (index: number) => {
      // Reset all lines
      lyrics.forEach((_, i) => {
        if (i !== index) {
          Animated.parallel([
            Animated.timing(scaleAnims[i], {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnims[i], {
              toValue: 0.5,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }
      });
      
      // Animate active line
      Animated.parallel([
        Animated.timing(scaleAnims[index], {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnims[index], {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    };
    
    animateLine(activeIndex);
    
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % lyrics.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [activeIndex]);
  
  return (
    <View style={{ marginTop: 16 }}>
      <Text
        style={{
          color: "#fff",
          fontSize: 22,
          fontFamily: "CircularStd",
          fontWeight: "600",
          marginBottom: 12,
        }}
      >
        Lyrics preview
      </Text>
      <View
        style={{
          backgroundColor: "#282828",
          borderRadius: 12,
          overflow: "hidden",
          padding: 20,
        }}
      >
        {lyrics.map((line, i) => (
          <Animated.View
            key={i}
            style={{
              transform: [{ scale: scaleAnims[i] }],
              opacity: opacityAnims[i],
              marginVertical: 10,
            }}
          >
            <Text
              style={{
                color: i === activeIndex ? "#fff" : "#888",
                fontSize: 17,
                fontFamily: "CircularStd",
                fontWeight: "600",
                lineHeight: 26,
                textAlign: "center",
              }}
            >
              {line}
            </Text>
          </Animated.View>
        ))}
        <TouchableOpacity
          activeOpacity={0.85}
          style={{
            backgroundColor: "#fff",
            paddingHorizontal: 22,
            paddingVertical: 12,
            borderRadius: 50,
            alignSelf: "flex-start",
            marginTop: 16,
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
      </View>
    </View>
  );
});

function MiniPlayerContent() {
  const insets = useSafeAreaInsets();
  const deviceInfo = useBluetoothDevice();
  const {
    currentSong,
    isPlaying,
    isExpanded,
    expandAnim,
    togglePlayPause,
    toggleExpand,
    skipToNext,
    skipToPrevious,
  } = useMusicPlayer();

  const slideAnim = useRef(new Animated.Value(0)).current;
  const [bgColor, setBgColor] = useState("#2d8a8a");
  const scrollY = useRef(new Animated.Value(0)).current;
  const [controlsRowY, setControlsRowY] = useState(0);

  useEffect(() => {
    if (currentSong?.image_url)
      setBgColor(extractDominantColor(currentSong.image_url));
  }, [currentSong?.image_url]);

  function extractDominantColor(uri: string): string {
    let hash = 0;
    for (let i = 0; i < uri.length; i++) {
      hash = (hash << 5) - hash + uri.charCodeAt(i);
      hash = hash & hash;
    }
    const colors = [
      "#2d8a8a", "#8a2d8a", "#8a8a2d", "#2d5a8a", "#8a4a2d",
      "#2d8a5a", "#5a2d8a", "#8a2d5a", "#4a8a2d", "#2d4a8a",
      "#8a6a2d", "#6a2d8a", "#2d8a6a", "#8a2d6a", "#6a8a2d",
      "#3d6a8a", "#8a3d6a", "#6a8a3d", "#3d8a6a", "#6a3d8a",
    ];
    return colors[Math.abs(hash) % colors.length];
  }

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: currentSong ? 0 : MINI_PLAYER_HEIGHT + 10,
      useNativeDriver: true,
      friction: 10,
      tension: 50,
    }).start();
  }, [currentSong]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isExpanded) {
        toggleExpand();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isExpanded, toggleExpand]);

  // First artist image for About/Explore sections
  const [artistImageUrl, setArtistImageUrl] = useState<string>("");

  useEffect(() => {
    if (!currentSong) return;
    const fromContext = currentSong?.artists?.[0]?.image_url;
    if (fromContext) {
      setArtistImageUrl(fromContext);
      return;
    }
    const fetchArtistImage = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data } = await supabase
          .from("song_artists")
          .select("artists(image_url)")
          .eq("song_id", currentSong.id)
          .limit(1)
          .single();
        const img = (data as any)?.artists?.image_url;
        if (img) setArtistImageUrl(img);
        else setArtistImageUrl(currentSong.image_url || "");
      } catch {
        setArtistImageUrl(currentSong?.image_url || "");
      }
    };
    fetchArtistImage();
  }, [currentSong?.id]);

  if (!currentSong) return null;

  const artistName =
    currentSong.artist_name ||
    currentSong.artists?.map((a: any) => a.name).join(", ") ||
    "Unknown Artist";

  const firstArtistImage = artistImageUrl || currentSong?.image_url || "";
  const firstArtistName =
    currentSong.artists?.[0]?.name || artistName.split(",")[0].trim();

  const miniPlayerOpacity = expandAnim.interpolate({
    inputRange: [0, 0.3],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const expandedPlayerOpacity = expandAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const expandedTranslateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
    extrapolate: "clamp",
  });

  const stickyBarOpacity = scrollY.interpolate({
    inputRange: [
      Math.max(0, controlsRowY - 10),
      Math.max(1, controlsRowY + 30),
    ],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const bgGradientOpacity = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -80],
    extrapolate: "clamp",
  });

  return (
    <>
      {/* ── Mini Player (collapsed) ─────────────────────────── */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 65 + insets.bottom,
          left: 8,
          right: 8,
          height: MINI_PLAYER_HEIGHT,
          transform: [{ translateY: slideAnim }],
          zIndex: 100,
        }}
        pointerEvents="box-none"
      >
        <Animated.View
          style={{ opacity: miniPlayerOpacity }}
          pointerEvents="auto"
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={toggleExpand}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: bgColor,
              borderRadius: 8,
              padding: 8,
              paddingHorizontal: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 10,
            }}
          >
            <Image
              source={{ uri: currentSong.image_url || "" }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 4,
                backgroundColor: "#2a2a2a",
              }}
              contentFit="cover"
              transition={200}
            />
            <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
              <Animated.Text
                numberOfLines={1}
                style={{
                  color: "#fff",
                  fontSize: 14,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                }}
              >
                {currentSong.title}
              </Animated.Text>
              <Animated.Text
                numberOfLines={1}
                style={{
                  color: "#E3E3E3",
                  fontSize: 12,
                  fontFamily: "CircularStd",
                  marginTop: 2,
                }}
              >
                {artistName}
              </Animated.Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <TouchableOpacity
                onPress={() => {}}
                style={{ padding: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Image
                  source={require("@/assets/images/ico-24-musical-box.png")}
                  style={{ width: 24, height: 24 }}
                  contentFit="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {}}
                style={{ padding: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Image
                  source={require("@/assets/images/ico-32-plus-circle.png")}
                  style={{ width: 24, height: 24 }}
                  contentFit="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                activeOpacity={0.6}
                style={{ padding: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Image
                  source={
                    isPlaying
                      ? require("@/assets/images/ico-32-pause.png")
                      : require("@/assets/images/ico-32-play.png")
                  }
                  style={{ width: 36, height: 36, tintColor: "#fff" }}
                  contentFit="contain"
                />
              </TouchableOpacity>
            </View>
            <MiniPlayerProgress />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* ── Expanded Player ─────────────────────────────────── */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#121212",
          opacity: expandedPlayerOpacity,
          transform: [{ translateY: expandedTranslateY }],
          zIndex: 200,
        }}
        pointerEvents={isExpanded ? "auto" : "none"}
      >
        {/* Fading background gradient */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: bgGradientOpacity,
          }}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[bgColor, `${bgColor}80`, "#121212"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        </Animated.View>

        {/* Sticky mini-bar — appears when controls scroll off screen */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            opacity: stickyBarOpacity,
            backgroundColor: bgColor,
            paddingTop: insets.top,
            paddingHorizontal: 16,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(0,0,0,0.15)",
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Animated.Text
              numberOfLines={1}
              style={{
                color: "#fff",
                fontSize: 15,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              {currentSong.title}
            </Animated.Text>
            <Animated.Text
              numberOfLines={1}
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 13,
                fontFamily: "CircularStd",
                marginTop: 2,
              }}
            >
              {artistName}
            </Animated.Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image
                source={require("@/assets/images/ico-32-plus-circle.png")}
                style={{ width: 26, height: 26 }}
                contentFit="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={togglePlayPause}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image
                source={
                  isPlaying
                    ? require("@/assets/images/ico-32-pause.png")
                    : require("@/assets/images/ico-32-play.png")
                }
                style={{ width: 32, height: 32, tintColor: "#fff" }}
                contentFit="contain"
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Scrollable content — header is INSIDE scroll so it scrolls away */}
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
        >
          {/* Scrollable header (chevron + playing from + options) */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingTop: insets.top + 8,
              paddingBottom: 12,
            }}
          >
            <TouchableOpacity onPress={toggleExpand} style={{ padding: 8 }}>
              <Image
                source={require("@/assets/images/ico-24-musical-chevron02-dw.png")}
                style={{ width: 24, height: 24 }}
                contentFit="contain"
              />
            </TouchableOpacity>
            <View style={{ alignItems: "center" }}>
              <Animated.Text
                style={{
                  color: "#fff",
                  fontSize: 11,
                  fontFamily: "CircularStd",
                  opacity: 0.7,
                  letterSpacing: 0.5,
                }}
              >
                PLAYING FROM {currentSong.album_title ? "ALBUM" : "LIBRARY"}
              </Animated.Text>
              <Animated.Text
                numberOfLines={1}
                style={{
                  color: "#fff",
                  fontSize: 12,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                }}
              >
                {currentSong.album_title || "Your Library"}
              </Animated.Text>
            </View>
            <TouchableOpacity style={{ padding: 8 }}>
              <Image
                source={require("@/assets/images/ico-24-bullet.png")}
                style={{ width: 24, height: 24 }}
                contentFit="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Album Art */}
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 32,
              paddingVertical: 32,
            }}
          >
            <View
              style={{
                width: "100%",
                aspectRatio: 1,
                borderRadius: 8,
                backgroundColor: "#2a2a2a",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 20,
              }}
            >
              <Image
                source={{ uri: currentSong.image_url || "" }}
                style={{ width: "100%", height: "100%", borderRadius: 8 }}
                contentFit="cover"
                transition={300}
              />
            </View>
          </View>

          {/* Song info + controls */}
          <View style={{ paddingHorizontal: 24 }}>
            {/* Title & add */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <Animated.Text
                  numberOfLines={1}
                  style={{
                    color: "#fff",
                    fontSize: 22,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                    marginBottom: 4,
                  }}
                >
                  {currentSong.title}
                </Animated.Text>
                <Animated.Text
                  numberOfLines={1}
                  style={{
                    color: "#B3B3B3",
                    fontSize: 16,
                    fontFamily: "CircularStd",
                  }}
                >
                  {artistName}
                </Animated.Text>
              </View>
              <TouchableOpacity style={{ padding: 8 }}>
                <Image
                  source={require("@/assets/images/ico-32-plus-circle.png")}
                  style={{ width: 28, height: 28 }}
                  contentFit="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Progress bar - separate component */}
            <ProgressBar />

            {/* Controls row */}
            <View
              onLayout={(e) => setControlsRowY(e.nativeEvent.layout.y)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <TouchableOpacity onPress={() => {}}>
                <Image
                  source={require("@/assets/images/ico-32-shuffle.png")}
                  style={{ width: 28, height: 28, tintColor: "#1DB954" }}
                  contentFit="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={skipToPrevious}>
                <Image
                  source={require("@/assets/images/ico-32-back.png")}
                  style={{ width: 32, height: 32, tintColor: "#fff" }}
                  contentFit="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={togglePlayPause}
                activeOpacity={0.8}
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 31,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  source={
                    isPlaying
                      ? require("@/assets/images/ico-32-pause.png")
                      : require("@/assets/images/ico-32-play.png")
                  }
                  style={{ width: 36, height: 36, tintColor: "#121212" }}
                  contentFit="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={skipToNext}>
                <Image
                  source={require("@/assets/images/ico-32-forward.png")}
                  style={{ width: 32, height: 32, tintColor: "#fff" }}
                  contentFit="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}}>
                <Image
                  source={require("@/assets/images/ico-32-cronology.png")}
                  style={{ width: 28, height: 28, tintColor: "#fff" }}
                  contentFit="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Bottom row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 8,
                marginBottom: 32,
              }}
            >
              {deviceInfo.isConnected ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Image
                    source={require("@/assets/images/ico-24-musical-box.png")}
                    style={{
                      width: 20,
                      height: 20,
                      tintColor: "#1DB954",
                      marginRight: 8,
                    }}
                    contentFit="contain"
                  />
                  <Animated.Text
                    numberOfLines={1}
                    style={{
                      color: "#1DB954",
                      fontSize: 13,
                      fontFamily: "CircularStd",
                      fontWeight: "500",
                      maxWidth: 180,
                    }}
                  >
                    {deviceInfo.deviceName}
                  </Animated.Text>
                </View>
              ) : (
                <View style={{ width: 20 }} />
              )}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 20 }}
              >
                <TouchableOpacity onPress={() => {}}>
                  <Image
                    source={require("@/assets/images/share.png")}
                    style={{ width: 24, height: 24, tintColor: "#B3B3B3" }}
                    contentFit="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {}}>
                  <Image
                    source={require("@/assets/images/ico-24-list.png")}
                    style={{ width: 24, height: 24, tintColor: "#B3B3B3" }}
                    contentFit="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Lyrics Preview Card with Karaoke Animation */}
            <LyricsAnimation />

            {/* About the Artist Card — uses first artist image */}
            <View style={{ marginTop: 16 }}>
              <Animated.Text
                style={{
                  color: "#fff",
                  fontSize: 22,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                  marginBottom: 12,
                }}
              >
                About
              </Animated.Text>
              <View
                style={{
                  backgroundColor: "#282828",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {/* Artist Image */}
                <Image
                  source={{ uri: firstArtistImage }}
                  style={{
                    width: "100%",
                    height: 240,
                  }}
                  contentFit="cover"
                  transition={300}
                />

                {/* Info Row */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 16,
                    paddingTop: 12,
                    paddingBottom: 8,
                  }}
                >
                  <View>
                    <Animated.Text
                      style={{
                        color: "#fff",
                        fontSize: 26,
                        fontFamily: "CircularStd",
                        fontWeight: "600",
                        letterSpacing: -0.5,
                      }}
                    >
                      {firstArtistName}
                    </Animated.Text>
                    <Animated.Text
                      style={{
                        color: "#a7a7a7",
                        fontSize: 13,
                        fontFamily: "CircularStd",
                        marginTop: 2,
                      }}
                    >
                      11.9M monthly listeners
                    </Animated.Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                      borderWidth: 1,
                      borderColor: "#fff",
                      borderRadius: 16,
                      paddingHorizontal: 16,
                      paddingVertical: 6,
                    }}
                  >
                    <Animated.Text
                      style={{
                        color: "#fff",
                        fontSize: 13,
                        fontFamily: "CircularStd",
                        fontWeight: "600",
                      }}
                    >
                      Follow
                    </Animated.Text>
                  </TouchableOpacity>
                </View>

                {/* Description */}
                <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                  <Animated.Text
                    style={{
                      color: "#a7a7a7",
                      fontSize: 14,
                      fontFamily: "CircularStd",
                      lineHeight: 20,
                    }}
                    numberOfLines={3}
                  >
                    {firstArtistName} — the name setting the Indian pop scene on fire! This 20-year-old singer, songwriter, and composer from Dehradun, is a powerhouse of t...
                  </Animated.Text>
                  <TouchableOpacity style={{ marginTop: 4 }}>
                    <Animated.Text
                      style={{
                        color: "#fff",
                        fontSize: 14,
                        fontFamily: "CircularStd",
                        fontWeight: "600",
                      }}
                    >
                      see more
                    </Animated.Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Explore [Artist] section — uses first artist image */}
            <View
              style={{
                marginTop: 24,
                paddingHorizontal: 16,
              }}
            >
              <Animated.Text
                style={{
                  color: "#fff",
                  fontSize: 20,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                  marginBottom: 16,
                }}
              >
                Explore {firstArtistName}
              </Animated.Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[
                  { label: `Songs by\n${firstArtistName}` },
                  { label: `Similar to\n${firstArtistName}` },
                  { label: `Similar to\n${currentSong.title}` },
                ].map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      aspectRatio: 0.8,
                      borderRadius: 4,
                      overflow: "hidden",
                      backgroundColor: "#2a2a2a",
                    }}
                  >
                    <Image
                      source={{ uri: firstArtistImage }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      }}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.7)"]}
                      locations={[0.5, 1]}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "70%",
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: 12,
                      }}
                    >
                      <Animated.Text
                        style={{
                          color: "#fff",
                          fontSize: 12,
                          fontFamily: "CircularStd",
                          fontWeight: "600",
                          lineHeight: 16,
                        }}
                      >
                        {item.label}
                      </Animated.Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Animated.ScrollView>
      </Animated.View>
    </>
  );
}

// Wrap with React.memo and export
export default React.memo(MiniPlayerContent);
