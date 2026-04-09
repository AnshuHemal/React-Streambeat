import ArtistsSheet from "@/components/ArtistsSheet";
import BottomDialog from "@/components/BottomDialog";
import SongOptionsSheet from "@/components/SongOptionsSheet";
import { useLikedSongs } from "@/context/LikedSongsContext";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { useBluetoothDevice } from "@/hooks/useAudioDevice";
import { usePlayerColor } from "@/hooks/usePlayerColor";
import {
  fetchSongCredits,
  ResolvedCredit,
  SongCreditsPayload,
} from "@/services/credits";
import { Ionicons } from "@expo/vector-icons";
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
import { CreditsCard } from "./CreditsCard";
import CreditsSheet from "./CreditsSheet";
import { LyricsCard } from "./LyricsCard";
import { MiniProgressBar } from "./ProgressBar";
import { SeekBar } from "./SeekBar";
import { SleepTimerSheet } from "./SleepTimerSheet";
import { StickyHeader } from "./StickyHeader";
import { useFollowArtist } from "@/hooks/useFollowArtist";

const { height: SCREEN_H } = Dimensions.get("window");
const MINI_H = 64;

// ─── Follow button sub-component ──────────────────────────────────────────────
// Extracted so useFollowArtist is called after resolvedArtists is known,
// avoiding the "used before declaration" error in the parent component.
function FollowArtistButton({ artistId }: { artistId: string | undefined }) {
  const { isFollowing, toggleFollow, scaleAnim } = useFollowArtist(artistId);
  if (!artistId) return null;
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={toggleFollow}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          borderWidth: 1,
          borderColor: isFollowing ? "#1DB954" : "rgba(255,255,255,0.5)",
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 5,
          marginRight: 8,
          backgroundColor: isFollowing ? "rgba(29,185,84,0.15)" : "transparent",
        }}
      >
        <Text
          style={{
            color: isFollowing ? "#1DB954" : "#ffffff",
            fontSize: 12,
            fontFamily: "CircularStd",
            fontWeight: "600",
          }}
        >
          {isFollowing ? "Following" : "Follow"}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

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
    pause,
    stopPlayer,
  } = useMusicPlayer();

  const slideAnim = useRef(new Animated.Value(0)).current;
  // Holds the last known song so mini player content stays visible
  // during the exit animation after currentSong is cleared
  const [displaySong, setDisplaySong] = useState(currentSong);

  useEffect(() => {
    if (currentSong) {
      // New song — update display immediately then spring in
      setDisplaySong(currentSong);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 10,
        tension: 50,
      }).start();
    } else {
      // Song cleared — slide out first, then clear display content
      Animated.timing(slideAnim, {
        toValue: MINI_H + 20,
        duration: 280,
        useNativeDriver: true,
        easing: (t) => t * t * t,
      }).start(() => {
        setDisplaySong(null);
      });
    }
  }, [currentSong]);
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
  const [showCreditsSheet, setShowCreditsSheet] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [fetchedArtists, setFetchedArtists] = useState<any[]>([]);
  const [creditsPayload, setCreditsPayload] = useState<SongCreditsPayload>({
    credits: [],
    sources: [],
  });

  const bgColor = usePlayerColor(currentSong?.image_url);
  const { isLiked: isLikedFn, toggleLike, getScaleAnim } = useLikedSongs();
  const songIsLiked = currentSong ? isLikedFn(currentSong.id) : false;
  const likeScaleAnim = currentSong
    ? getScaleAnim(currentSong.id)
    : new Animated.Value(1);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger if pulling down from the top of the scrollview
        return (
          scrollYRaw.current <= 0 &&
          gestureState.dy > 20 &&
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

  const scrollY = useRef(new Animated.Value(0)).current;

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
    const fromCtx = currentSong.artists;
    if (fromCtx && fromCtx.length > 0) {
      setArtistImage(fromCtx[0]?.image_url || "");
      setFetchedArtists(fromCtx);
      return;
    }
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data } = await supabase
          .from("song_artists")
          .select("artists(id, name, image_url)")
          .eq("song_id", currentSong.id);

        if (data && data.length > 0) {
          const valid = data.map((d: any) => d.artists).filter(Boolean);
          setFetchedArtists(valid);
          setArtistImage(valid[0]?.image_url || currentSong.image_url || "");
        } else {
          setFetchedArtists([]);
          setArtistImage(currentSong.image_url || "");
        }
      } catch {
        setFetchedArtists([]);
        setArtistImage(currentSong.image_url || "");
      }
    })();
  }, [currentSong?.id]);

  // Fetch real credits from DB whenever the song changes
  useEffect(() => {
    if (!currentSong?.id) {
      setCreditsPayload({ credits: [], sources: [] });
      return;
    }
    fetchSongCredits(currentSong.id).then(setCreditsPayload);
  }, [currentSong?.id]);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      scrollYRaw.current = value;
      setStickyVisible(value >= controlsY);
    });
    return () => scrollY.removeListener(id);
  }, [controlsY]);

  if (!displaySong) return null;

  // activeSong: use live currentSong when available, fall back to displaySong
  // during the exit animation so content doesn't flash away
  const activeSong = currentSong ?? displaySong;

  const resolvedArtists =
    fetchedArtists.length > 0 ? fetchedArtists : activeSong.artists || [];

  const artistName =
    activeSong.artist_name ||
    resolvedArtists.map((a: any) => a.name).join(", ") ||
    "Unknown Artist";
  const firstArtistName =
    resolvedArtists[0]?.name || artistName.split(",")[0].trim();
  const firstArtistImage =
    typeof artistImage === "string" && artistImage
      ? artistImage
      : activeSong.image_url || "";

  // Build credits array — use real DB credits when available, fall back to artist list
  const creditsData: ResolvedCredit[] =
    creditsPayload.credits.length > 0
      ? creditsPayload.credits
      : resolvedArtists.length > 0
        ? resolvedArtists.map((a: any, i: number) => ({
            artistId: a.id,
            name: a.name,
            roles:
              i === 0
                ? "Main Artist • Author • Composer"
                : i === 1
                  ? "Main Artist • Producer"
                  : "Main Artist • Author",
          }))
        : artistName.split(",").map((n: string, i: number) => ({
            artistId: `unknown-${i}`,
            name: n.trim(),
            roles:
              i === 0
                ? "Main Artist • Author • Composer"
                : i === 1
                  ? "Main Artist • Producer"
                  : "Main Artist • Author",
          }));

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
            onLongPress={() => setShowStopDialog(true)}
            delayLongPress={400}
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
              source={{ uri: activeSong.image_url || "" }}
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
                {activeSong.title}
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
                onPress={(e) => {
                  e.stopPropagation();
                  if (currentSong) toggleLike(currentSong.id);
                }}
                style={{ padding: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Animated.View
                  style={{ transform: [{ scale: likeScaleAnim }] }}
                >
                  <Ionicons
                    name={
                      songIsLiked ? "checkmark-circle" : "add-circle-outline"
                    }
                    size={24}
                    color={songIsLiked ? "#1DB954" : "#fff"}
                  />
                </Animated.View>
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
            {...panResponder.panHandlers}
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
                PLAYING FROM {activeSong.album_title ? "ALBUM" : "LIBRARY"}
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
                {activeSong.album_title || "Your Library"}
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
                source={{ uri: activeSong.image_url || "" }}
                style={{ width: "100%", height: "100%", borderRadius: 8 }}
                contentFit="cover"
                transition={300}
              />
            </View>
          </Animated.View>

          <View style={{ paddingHorizontal: 24 }}>
            {/* Title + follow + like */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
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
                  {activeSong.title}
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

              {/* Follow artist */}
              <FollowArtistButton artistId={resolvedArtists[0]?.id} />

              {/* Like song button */}
              <TouchableOpacity
                onPress={() => toggleLike(activeSong.id)}
                activeOpacity={0.7}
                style={{ padding: 8 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Animated.View
                  style={{ transform: [{ scale: likeScaleAnim }] }}
                >
                  <Ionicons
                    name={
                      songIsLiked ? "checkmark-circle" : "add-circle-outline"
                    }
                    size={28}
                    color={songIsLiked ? "#1DB954" : "#fff"}
                  />
                </Animated.View>
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
              artistName={firstArtistName}
              artistImage={firstArtistImage}
              songTitle={activeSong.title}
            />
            <CreditsCard
              credits={creditsData}
              onShowAll={() => setShowCreditsSheet(true)}
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
        songId={activeSong.id}
        songTitle={activeSong.title}
        artistName={artistName}
        albumTitle={activeSong.album_title || ""}
        imageUrl={activeSong.image_url}
        artists={resolvedArtists.map((a: any) => ({
          id: a.id || `mock-${a.name}`,
          name: a.name,
          image_url: a.image_url ?? null,
        }))}
      />

      <ArtistsSheet
        visible={showArtistsSheet}
        onClose={() => setShowArtistsSheet(false)}
        artists={
          resolvedArtists.length > 0
            ? resolvedArtists.map((a: any) => ({
                id: a.id,
                name: a.name,
                image_url: a.image_url ?? null,
              }))
            : [
                {
                  id: "mock",
                  name: firstArtistName,
                  image_url: firstArtistImage,
                },
              ]
        }
      />

      <CreditsSheet
        visible={showCreditsSheet}
        onClose={() => setShowCreditsSheet(false)}
        songTitle={activeSong.title}
        artistNames={creditsData.map((c) => c.name).join(" • ")}
        payload={{
          credits: creditsData,
          sources: creditsPayload.sources,
        }}
      />

      <BottomDialog
        visible={showStopDialog}
        title="Stop playback?"
        description={`"${activeSong.title}" is currently playing. Do you want to stop the player?`}
        confirmLabel="Stop Player"
        dismissLabel="Keep Playing"
        onConfirm={() => {
          setShowStopDialog(false);
          stopPlayer();
        }}
        onDismiss={() => setShowStopDialog(false)}
      />
    </>
  );
}

export default React.memo(PlayerComponent);
