import { LikedSongRow } from "@/components/liked-songs/LikedSongRow";
import { LikedSongsHeader } from "@/components/liked-songs/LikedSongsHeader";
import {
  LikedSongsSortOption,
  LikedSongsSortSheet,
} from "@/components/liked-songs/LikedSongsSortSheet";
import SongOptionsSheet from "@/components/SongOptionsSheet";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { LikedSong, useLikedSongsData } from "@/hooks/useLikedSongsData";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_H } = Dimensions.get("window");

export default function LikedSongsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { playSong, setQueue, currentSong, isPlaying } = useMusicPlayer();
  const { songs, loading } = useLikedSongsData();

  const [listVisible, setListVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState<LikedSong | null>(null);
  const [sortOption, setSortOption] =
    useState<LikedSongsSortOption>("recently_added");
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Y position of the controls row in content space (set via onLayout)
  const [controlsRowY, setControlsRowY] = useState(320);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const controlsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.stagger(100, [
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 360,
          useNativeDriver: true,
        }),
        Animated.timing(controlsAnim, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start(() => setListVisible(true));
    }
  }, [loading]);

  // Where the play button docks in the sticky header (vertically centred)
  const DOCKED_TOP = insets.top + 32;

  // Play button starts at controlsRowY, scrolls up, clamps at DOCKED_TOP
  const scrollThreshold = Math.max(1, controlsRowY - DOCKED_TOP);
  const playButtonTranslateY = scrollY.interpolate({
    inputRange: [0, scrollThreshold],
    outputRange: [0, -(controlsRowY - DOCKED_TOP)],
    extrapolate: "clamp",
  });

  // Sticky header bar fades in as play button docks
  const stickyOpacity = scrollY.interpolate({
    inputRange: [scrollThreshold * 0.6, scrollThreshold],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const filteredSongs = searchQuery.trim()
    ? songs.filter((s) => {
        const q = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.artist_name.toLowerCase().includes(q)
        );
      })
    : songs;

  const handlePlay = useCallback(
    (index: number) => {
      if (!filteredSongs.length) return;
      setQueue(filteredSongs as any, index);
      playSong(filteredSongs[index] as any);
    },
    [filteredSongs, setQueue, playSong],
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      {/* ── Sticky header bar — fades in as play button docks ── */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          opacity: stickyOpacity,
          backgroundColor: "#1a3a6b",
          paddingTop: insets.top + 12,
          paddingBottom: 14,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {/* Back button — tappable even when sticky header is visible */}
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ padding: 4 }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text
          style={{
            color: "#fff",
            fontSize: 17,
            fontFamily: "CircularStd",
            fontWeight: "600",
            flex: 1,
            textAlign: "center",
            marginRight: 30, // balance the back arrow width so title is truly centred
          }}
        >
          Liked Songs
        </Text>
      </Animated.View>

      {/* ── Floating play button — hidden while loading ── */}
      {!loading && (
        <Animated.View
          style={{
            position: "absolute",
            right: 16,
            top: controlsRowY,
            zIndex: 30,
            transform: [{ translateY: playButtonTranslateY }],
          }}
        >
          <TouchableOpacity
            onPress={() => handlePlay(0)}
            activeOpacity={0.85}
            style={{
              width: 48,
              height: 48,
              borderRadius: 28,
              backgroundColor: "#1DB954",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#1DB954",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.45,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <Image
              source={require("@/assets/images/ico-32-play.png")}
              style={{ width: 28, height: 28, tintColor: "#000" }}
              contentFit="contain"
            />
          </TouchableOpacity>
        </Animated.View>
      )}

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text
            style={{
              color: "#a7a7a7",
              fontFamily: "CircularStd",
              fontSize: 14,
            }}
          >
            Loading...
          </Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredSongs}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <LikedSongRow
              song={item}
              isCurrentSong={currentSong?.id === item.id}
              isPlaying={isPlaying}
              onPress={() => handlePlay(index)}
              onOptionsPress={() => setSelectedSong(item)}
              index={index}
              visible={listVisible}
            />
          )}
          ListHeaderComponent={
            <LikedSongsHeader
              songs={songs}
              onBack={() => router.back()}
              onShuffle={() =>
                handlePlay(Math.floor(Math.random() * filteredSongs.length))
              }
              headerAnim={headerAnim}
              controlsAnim={controlsAnim}
              paddingTop={insets.top}
              onControlsRowLayout={(y) => setControlsRowY(y)}
              onSortPress={() => setShowSortSheet(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
          bounces
          alwaysBounceVertical
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 48 }}>
              <Ionicons
                name={searchQuery ? "search-outline" : "heart-outline"}
                size={52}
                color="#535353"
              />
              <Text
                style={{
                  color: "#a7a7a7",
                  fontFamily: "CircularStd",
                  fontSize: 16,
                  marginTop: 16,
                  textAlign: "center",
                  paddingHorizontal: 40,
                }}
              >
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "Songs you like will appear here"}
              </Text>
            </View>
          }
          ListFooterComponent={
            <View style={{ height: Math.max(SCREEN_H * 0.5, 300) }} />
          }
        />
      )}

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

      <LikedSongsSortSheet
        visible={showSortSheet}
        selected={sortOption}
        onSelect={setSortOption}
        onClose={() => setShowSortSheet(false)}
      />
    </View>
  );
}
