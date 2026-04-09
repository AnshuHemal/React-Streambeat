import LoadingDots from "@/components/LoadingDots";
import PlayingIndicator from "@/components/PlayingIndicator";
import SongOptionsSheet from "@/components/SongOptionsSheet";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { ArtistSong, useArtistData } from "@/hooks/useArtistData";
import { useFollowArtist } from "@/hooks/useFollowArtist";
import { fallbackAlbumColor, useExtractedColor } from "@/hooks/useImageColor";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");
const HERO_H = SCREEN_W * 0.95;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatCount(n: number | null | undefined): string {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function releaseYear(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).getFullYear().toString();
}

function albumTypeLabel(t: string | null): string {
  if (!t) return "Album";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function ArtistScreen() {
  const { artistId } = useLocalSearchParams<{ artistId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { artist, songs, releases, fansAlsoLike, loading, error } =
    useArtistData(artistId);
  const {
    isFollowing,
    toggleFollow,
    scaleAnim: followAnim,
  } = useFollowArtist(artistId);
  const { playSong, setQueue, currentSong, isPlaying, togglePlayPause } =
    useMusicPlayer();

  const [showAllSongs, setShowAllSongs] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [selectedSong, setSelectedSong] = useState<ArtistSong | null>(null);

  // ── Scroll animations ──────────────────────────────────────────────────────
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [HERO_H - 80, HERO_H - 20],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HERO_H * 0.6],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.08, 1],
    extrapolate: "clamp",
  });

  const backBtnBg = headerOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(0,0,0,0.4)", "rgba(0,0,0,0)"],
    extrapolate: "clamp",
  });

  const extractedColor = useExtractedColor(artist?.image_url);
  const dominantColor =
    extractedColor !== "#1a1a1a"
      ? extractedColor
      : fallbackAlbumColor(artistId ?? "");

  // ── Playback helpers ───────────────────────────────────────────────────────
  const buildQueue = useCallback(
    (startIndex = 0) => {
      const queue = songs.map((s) => ({
        id: s.id,
        title: s.title,
        image_url: s.image_url,
        audio_url: s.audio_url,
        preview_url: s.preview_url,
        duration_ms: s.duration_ms,
        artist_name: s.artist_name,
        artists: s.artists,
        album_title: s.album_title ?? undefined,
      }));
      setQueue(queue, startIndex);
      playSong(queue[startIndex] as any);
    },
    [songs, setQueue, playSong],
  );

  const isArtistPlaying =
    isPlaying && songs.some((s) => s.id === currentSong?.id);

  const handlePlayPress = useCallback(() => {
    if (isArtistPlaying) {
      togglePlayPause();
    } else if (songs.length > 0) {
      buildQueue(0);
    }
  }, [isArtistPlaying, songs, buildQueue, togglePlayPause]);

  const handleShufflePress = useCallback(() => {
    if (songs.length === 0) return;
    const idx = Math.floor(Math.random() * songs.length);
    buildQueue(idx);
  }, [songs, buildQueue]);

  const handleSongPress = useCallback(
    (song: ArtistSong, index: number) => {
      if (currentSong?.id === song.id) {
        togglePlayPause();
      } else {
        buildQueue(index);
      }
    },
    [currentSong, togglePlayPause, buildQueue],
  );

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) return <LoadingDots />;

  if (error || !artist) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#121212",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{ color: "#a7a7a7", fontFamily: "CircularStd", fontSize: 15 }}
        >
          Artist not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: "#ffffff", fontFamily: "CircularStd" }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const visibleSongs = showAllSongs ? songs : songs.slice(0, 5);

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      {/* ── Floating back button ── */}
      <Animated.View
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: 16,
          zIndex: 30,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: backBtnBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Sticky header ── */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          opacity: headerOpacity,
        }}
        pointerEvents="none"
      >
        <View
          style={{
            backgroundColor: dominantColor,
            paddingTop: insets.top,
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{ flexDirection: "row", alignItems: "center", height: 52 }}
          >
            <View style={{ width: 36 }} />
            <Text
              style={{
                color: "#ffffff",
                fontSize: 17,
                fontFamily: "CircularStd",
                fontWeight: "600",
                flex: 1,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {artist.name}
            </Text>
            <View style={{ width: 36 }} />
          </View>
        </View>
      </Animated.View>

      {/* ── Scrollable content ── */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <Animated.View
          style={{
            height: HERO_H,
            transform: [{ scale: heroScale }],
            opacity: heroOpacity,
          }}
        >
          {artist.image_url ? (
            <Image
              source={{ uri: artist.image_url }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#2a2a2a",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="person" size={80} color="#535353" />
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(18,18,18,0.55)", "#121212"]}
            locations={[0.4, 0.75, 1]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: HERO_H * 0.55,
            }}
          />
          <View
            style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 36,
                fontFamily: "CircularStd",
                fontWeight: "600",
                marginBottom: 4,
              }}
              numberOfLines={2}
            >
              {artist.name}
            </Text>
            {artist.monthly_listeners != null && (
              <Text
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 14,
                  fontFamily: "CircularStd",
                }}
              >
                {formatCount(artist.monthly_listeners)} monthly listeners
              </Text>
            )}
          </View>
        </Animated.View>

        {/* ── Action row ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            {/* Follow button */}
            <Animated.View style={{ transform: [{ scale: followAnim }] }}>
              <TouchableOpacity
                onPress={toggleFollow}
                activeOpacity={0.8}
                style={{
                  borderWidth: 1,
                  borderColor: isFollowing
                    ? "#1DB954"
                    : "rgba(255,255,255,0.6)",
                  borderRadius: 20,
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  backgroundColor: isFollowing
                    ? "rgba(29,185,84,0.15)"
                    : "transparent",
                }}
              >
                <Text
                  style={{
                    color: isFollowing ? "#1DB954" : "#ffffff",
                    fontSize: 14,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                  }}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* More options */}
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color="#a7a7a7" />
            </TouchableOpacity>
          </View>

          {/* Shuffle + Play */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            <TouchableOpacity onPress={handleShufflePress} activeOpacity={0.7}>
              <Image
                source={require("@/assets/images/ico-32-shuffle.png")}
                style={{ width: 26, height: 26, tintColor: "#1DB954" }}
                contentFit="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePlayPress}
              activeOpacity={0.85}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "#1DB954",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#1DB954",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
                elevation: 10,
              }}
            >
              <Image
                source={
                  isArtistPlaying
                    ? require("@/assets/images/ico-32-pause.png")
                    : require("@/assets/images/ico-32-play.png")
                }
                style={{ width: 26, height: 26, tintColor: "#000000" }}
                contentFit="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Popular songs ── */}
        {songs.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 22,
                fontFamily: "CircularStd",
                fontWeight: "600",
                paddingHorizontal: 16,
                marginBottom: 8,
              }}
            >
              Popular
            </Text>

            {visibleSongs.map((song, index) => {
              const isCurrentSong = currentSong?.id === song.id;
              const isDimmed = !showAllSongs && index === 4 && songs.length > 5;

              return (
                <TouchableOpacity
                  key={song.id}
                  onPress={() => handleSongPress(song, index)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    opacity: isDimmed ? 0.4 : 1,
                  }}
                >
                  {/* Index */}
                  <View
                    style={{ width: 28, alignItems: "center", marginRight: 12 }}
                  >
                    {isCurrentSong && isPlaying ? (
                      <PlayingIndicator isPlaying={isPlaying} />
                    ) : (
                      <Text
                        style={{
                          color: isCurrentSong ? "#1DB954" : "#a7a7a7",
                          fontSize: 15,
                          fontFamily: "CircularStd",
                        }}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>

                  {/* Artwork */}
                  {song.image_url ? (
                    <Image
                      source={{ uri: song.image_url }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 4,
                        marginRight: 14,
                      }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 4,
                        backgroundColor: "#2a2a2a",
                        marginRight: 14,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="musical-note" size={20} color="#535353" />
                    </View>
                  )}

                  {/* Title + play count */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: isCurrentSong ? "#1DB954" : "#ffffff",
                        fontSize: 15,
                        fontFamily: "CircularStd",
                        fontWeight: "600",
                        marginBottom: 3,
                      }}
                      numberOfLines={1}
                    >
                      {song.title}
                    </Text>
                    {song.play_count != null && song.play_count > 0 && (
                      <Text
                        style={{
                          color: "#a7a7a7",
                          fontSize: 13,
                          fontFamily: "CircularStd",
                        }}
                      >
                        {formatCount(song.play_count)}
                      </Text>
                    )}
                  </View>

                  {/* Three dots */}
                  <TouchableOpacity
                    onPress={() => setSelectedSong(song)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ padding: 8 }}
                  >
                    <Ionicons
                      name="ellipsis-vertical"
                      size={18}
                      color="#a7a7a7"
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}

            {songs.length > 5 && (
              <View
                style={{ alignItems: "center", marginTop: 12, marginBottom: 4 }}
              >
                <TouchableOpacity
                  onPress={() => setShowAllSongs((v) => !v)}
                  activeOpacity={0.8}
                  style={{
                    borderWidth: 1,
                    borderColor: "#535353",
                    borderRadius: 50,
                    paddingHorizontal: 28,
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 14,
                      fontFamily: "CircularStd",
                      fontWeight: "600",
                    }}
                  >
                    {showAllSongs ? "See less" : "See more"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── Popular releases ── */}
        {releases.length > 0 && (
          <View style={{ marginTop: 32, paddingHorizontal: 16 }}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 22,
                fontFamily: "CircularStd",
                fontWeight: "600",
                marginBottom: 16,
              }}
            >
              Popular releases
            </Text>

            {releases.map((release) => (
              <TouchableOpacity
                key={release.id}
                activeOpacity={0.7}
                onPress={() => router.push(`/album/${release.id}` as any)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                {/* Artwork */}
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 4,
                    backgroundColor: "#2a2a2a",
                    marginRight: 14,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {release.image_url ? (
                    <Image
                      source={{ uri: release.image_url }}
                      style={{ width: 72, height: 72 }}
                      contentFit="cover"
                    />
                  ) : (
                    <Ionicons name="disc" size={28} color="#535353" />
                  )}
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  {release.isLatest && (
                    <Text
                      style={{
                        color: "#a7a7a7",
                        fontSize: 11,
                        fontFamily: "CircularStd",
                        marginBottom: 2,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Latest release
                    </Text>
                  )}
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
                    {release.title}
                  </Text>
                  <Text
                    style={{
                      color: "#a7a7a7",
                      fontSize: 13,
                      fontFamily: "CircularStd",
                    }}
                  >
                    {releaseYear(release.release_date)}
                    {release.album_type
                      ? ` • ${albumTypeLabel(release.album_type)}`
                      : ""}
                  </Text>
                </View>

                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ padding: 8 }}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={18}
                    color="#a7a7a7"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Fans Also Like ── */}
        {fansAlsoLike.length > 0 && (
          <View style={{ marginTop: 32 }}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 22,
                fontFamily: "CircularStd",
                fontWeight: "600",
                paddingHorizontal: 16,
                marginBottom: 16,
              }}
            >
              Fans also like
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
            >
              {fansAlsoLike.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  activeOpacity={0.75}
                  onPress={() => router.push(`/artist/${a.id}` as any)}
                  style={{ width: 110, alignItems: "center" }}
                >
                  {a.image_url ? (
                    <Image
                      source={{ uri: a.image_url }}
                      style={{ width: 110, height: 110, borderRadius: 55 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 110,
                        height: 110,
                        borderRadius: 55,
                        backgroundColor: "#2a2a2a",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="person" size={40} color="#535353" />
                    </View>
                  )}
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 13,
                      fontFamily: "CircularStd",
                      fontWeight: "600",
                      textAlign: "center",
                      marginTop: 8,
                    }}
                    numberOfLines={2}
                  >
                    {a.name}
                  </Text>
                  <Text
                    style={{
                      color: "#a7a7a7",
                      fontSize: 12,
                      fontFamily: "CircularStd",
                      marginTop: 2,
                    }}
                  >
                    Artist
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── About ── */}
        {artist.description && (
          <View
            style={{
              marginTop: 32,
              marginHorizontal: 16,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {/* Header image */}
            {artist.image_url && (
              <Image
                source={{ uri: artist.image_url }}
                style={{ width: "100%", height: 200 }}
                contentFit="cover"
              />
            )}
            <View
              style={{
                backgroundColor: "#1a1a1a",
                padding: 16,
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 22,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                About
              </Text>
              {artist.monthly_listeners != null && (
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 15,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  {formatCount(artist.monthly_listeners)} monthly listeners
                </Text>
              )}
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 14,
                  fontFamily: "CircularStd",
                  lineHeight: 22,
                }}
                numberOfLines={showAbout ? undefined : 4}
              >
                {artist.description}
              </Text>
              {artist.description.length > 200 && (
                <TouchableOpacity
                  onPress={() => setShowAbout((v) => !v)}
                  style={{ marginTop: 8 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 13,
                      fontFamily: "CircularStd",
                      fontWeight: "600",
                    }}
                  >
                    {showAbout ? "Show less" : "Show more"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* ── Song options sheet ── */}
      <SongOptionsSheet
        visible={selectedSong !== null}
        onClose={() => setSelectedSong(null)}
        songId={selectedSong?.id ?? null}
        songTitle={selectedSong?.title ?? ""}
        artistName={selectedSong?.artist_name ?? ""}
        albumTitle={selectedSong?.album_title ?? ""}
        imageUrl={selectedSong?.image_url ?? null}
        artists={selectedSong?.artists ?? []}
      />
    </View>
  );
}
