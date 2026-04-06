import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { useBluetoothDevice } from "@/hooks/useAudioDevice";
import { usePlayerColor } from "@/hooks/usePlayerColor";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArtistCard } from "./ArtistCard";
import { Controls } from "./Controls";
import { LyricsCard } from "./LyricsCard";
import { MiniProgressBar } from "./ProgressBar";
import { SeekBar } from "./SeekBar";
import { SleepTimerSheet } from "./SleepTimerSheet";
import { StickyHeader } from "./StickyHeader";
import SongOptionsSheet from "@/components/SongOptionsSheet";
import ArtistsSheet from "@/components/ArtistsSheet";

const { height: SCREEN_H } = Dimensions.get("window");
const MINI_H = 64;

function PlayerComponent() {
  const insets = useSafeAreaInsets();
  const deviceInfo = useBluetoothDevice();
  const {
    currentSong,
    isPlaying,
    isExpanded,
    expandAnim,
    togglePlayPause,
    toggleExpand,
    setIsExpanded,
  } = useMusicPlayer();

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollYRaw = useRef(0);
  const [controlsY, setControlsY] = useState(0);
  const [artistImage, setArtistImage] = useState("");
  const [stickyVisible, setStickyVisible] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [activeTimer, setActiveTimer] = useState<
    number | "end_of_track" | null
  >(null);
  const [showSongOptions, setShowSongOptions] = useState(false);
  const [showArtistsSheet, setShowArtistsSheet] = useState(false);

  const bgColor = usePlayerColor(currentSong?.image_url);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger if pulling down from the top of the scrollview
        return (
          scrollYRaw.current <= 0 &&
          gestureState.dy > 5 &&
          Math.abs(gestureState.dx) < Math.abs(gestureState.dy)
        );
      },
      onPanResponderGrant: () => {
        // Stop any ongoing animations
        expandAnim.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          const progress = Math.max(0, 1 - gestureState.dy / SCREEN_H);
          expandAnim.setValue(progress);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SCREEN_H * 0.15 || gestureState.vy > 1.2) {
          // Snap closed
          setIsExpanded(false);
          // Context's useEffect takes over and springs it to 0
        } else {
          // Snap back open
          Animated.spring(expandAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 10,
            tension: 40,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: currentSong ? 0 : MINI_H + 10,
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

  useEffect(() => {
    if (!currentSong) return;
    const fromCtx = currentSong.artists?.[0]?.image_url;
    if (fromCtx) {
      setArtistImage(fromCtx);
      return;
    }
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data } = await supabase
          .from("song_artists")
          .select("artists(image_url)")
          .eq("song_id", currentSong.id)
          .limit(1)
          .single();
        setArtistImage(
          (data as any)?.artists?.image_url || currentSong.image_url || "",
        );
      } catch {
        setArtistImage(currentSong.image_url || "");
      }
    })();
  }, [currentSong?.id]);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      scrollYRaw.current = value;
      setStickyVisible(value >= controlsY);
    });
    return () => scrollY.removeListener(id);
  }, [controlsY]);

  if (!currentSong) return null;

  const artistName =
    currentSong.artist_name ||
    currentSong.artists?.map((a: any) => a.name).join(", ") ||
    "Unknown Artist";
  const firstArtistName =
    currentSong.artists?.[0]?.name || artistName.split(",")[0].trim();
  const firstArtistImage = artistImage || currentSong.image_url || "";

  // Animations
  const miniOpacity = expandAnim.interpolate({
    inputRange: [0, 0.3],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const expandedOpacity = expandAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const expandedY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_H, 0],
    extrapolate: "clamp",
  });
  const bgOpacity = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const stickyOpacity = scrollY.interpolate({
    inputRange: [Math.max(0, controlsY - 10), Math.max(1, controlsY + 30)],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const albumScale = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [1.1, 1, 0.95],
    extrapolate: "clamp",
  });

  const albumOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.2],
    extrapolate: "clamp",
  });

  return (
    <>
      <Animated.View
        style={{
          position: "absolute",
          bottom: 65 + insets.bottom,
          left: 8,
          right: 8,
          height: MINI_H,
          transform: [{ translateY: slideAnim }],
          zIndex: 100,
        }}
        pointerEvents="box-none"
      >
        <Animated.View style={{ opacity: miniOpacity }} pointerEvents="auto">
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
              <Text
                numberOfLines={1}
                style={{
                  color: "#fff",
                  fontSize: 14,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                }}
              >
                {currentSong.title}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  color: "#E3E3E3",
                  fontSize: 12,
                  fontFamily: "CircularStd",
                  marginTop: 2,
                }}
              >
                {artistName}
              </Text>
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
            <MiniProgressBar />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* ── Expanded player ── */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#121212",
          opacity: expandedOpacity,
          transform: [{ translateY: expandedY }],
          zIndex: 200,
        }}
        pointerEvents={isExpanded ? "auto" : "none"}
      >
        {/* Drag handle zone — only this area captures the drag-to-close gesture */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: insets.top + 24, // Stops perfectly before the button row
            zIndex: 300,
          }}
          {...panResponder.panHandlers}
        >
          {/* Visual drag indicator */}
          <View
            style={{
              alignItems: "center",
              paddingTop: insets.top + 10,
            }}
            pointerEvents="none"
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "#fff",
                borderRadius: 2,
                opacity: 0.3,
              }}
            />
          </View>
        </View>

        {/* Fading gradient bg */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: bgOpacity,
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

        {/* Sticky header overlay */}
        <StickyHeader
          opacity={stickyOpacity}
          bgColor={bgColor}
          artistName={artistName}
          isVisible={stickyVisible}
        />

        {/* Scrollable content */}
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
        >
          {/* Scrollable header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingTop: insets.top + 24,
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
              <Text
                style={{
                  color: "#fff",
                  fontSize: 11,
                  fontFamily: "CircularStd",
                  opacity: 0.7,
                  letterSpacing: 0.5,
                }}
              >
                PLAYING FROM {currentSong.album_title ? "ALBUM" : "LIBRARY"}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  color: "#fff",
                  fontSize: 12,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                }}
              >
                {currentSong.album_title || "Your Library"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowSongOptions(true)}
              style={{ padding: 8 }}
            >
              <Image
                source={require("@/assets/images/ico-24-bullet.png")}
                style={{ width: 24, height: 24 }}
                contentFit="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Album art */}
          <Animated.View
            style={{
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 32,
              paddingVertical: 32,
              opacity: albumOpacity,
              transform: [{ scale: albumScale }],
            }}
          >
            <View
              style={{
                width: "100%",
                aspectRatio: 1,
                borderRadius: 8,
                backgroundColor: "#2a2a2a",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 15 },
                shadowOpacity: 0.4,
                shadowRadius: 30,
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
          </Animated.View>

          <View style={{ paddingHorizontal: 24 }}>
            {/* Title + add */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text
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
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    color: "#B3B3B3",
                    fontSize: 16,
                    fontFamily: "CircularStd",
                  }}
                >
                  {artistName}
                </Text>
              </View>
              <TouchableOpacity style={{ padding: 8 }}>
                <Image
                  source={require("@/assets/images/ico-32-plus-circle.png")}
                  style={{ width: 28, height: 28 }}
                  contentFit="contain"
                />
              </TouchableOpacity>
            </View>

            <SeekBar />
            <Controls
              onLayout={setControlsY}
              onTimerPress={() => setShowSleepTimer(true)}
            />

            {/* Device + share row */}
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
                  <Text
                    numberOfLines={1}
                    style={{
                      color: "#1DB954",
                      fontSize: 12,
                      fontFamily: "CircularStd",
                      fontWeight: "500",
                      maxWidth: 180,
                    }}
                  >
                    {deviceInfo.deviceName}
                  </Text>
                </View>
              ) : (
                <View style={{ width: 20 }} />
              )}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 20 }}
              >
                <TouchableOpacity>
                  <Image
                    source={require("@/assets/images/ico-24-share.png")}
                    style={{ width: 24, height: 24, tintColor: "#B3B3B3" }}
                    contentFit="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Image
                    source={require("@/assets/images/ico-24-list.png")}
                    style={{ width: 24, height: 24, tintColor: "#B3B3B3" }}
                    contentFit="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <LyricsCard bgColor={bgColor} />
            <ArtistCard
              artistName={artistName}
              artistImage={firstArtistImage}
              songTitle={currentSong.title}
            />
          </View>
        </Animated.ScrollView>
      </Animated.View>

      <SleepTimerSheet
        visible={showSleepTimer}
        onClose={() => setShowSleepTimer(false)}
        activeMinutes={activeTimer}
        onSelect={(opt) => setActiveTimer(opt.minutes)}
      />

      <SongOptionsSheet
        visible={showSongOptions}
        onClose={() => setShowSongOptions(false)}
        onShowArtists={() => setShowArtistsSheet(true)}
        songTitle={currentSong.title}
        artistName={artistName}
        albumTitle={currentSong.album_title || "Unknown Album"}
        imageUrl={currentSong.image_url || null}
      />

      <ArtistsSheet
        visible={showArtistsSheet}
        onClose={() => setShowArtistsSheet(false)}
        artists={currentSong.artists || [{ id: "mock", name: artistName, image_url: firstArtistImage }]}
      />
    </>
  );
}

export default React.memo(PlayerComponent);
