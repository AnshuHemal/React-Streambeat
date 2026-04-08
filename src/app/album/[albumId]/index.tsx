import AlbumOptionsSheet from "@/components/AlbumOptionsSheet";
import ArtistsSheet from "@/components/ArtistsSheet";
import LoadingDots from "@/components/LoadingDots";
import PlayingIndicator from "@/components/PlayingIndicator";
import ShuffleSheet from "@/components/ShuffleSheet";
import SongOptionsSheet from "@/components/SongOptionsSheet";
import { useLikedSongs } from "@/context/LikedSongsContext";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { usePlayerColor } from "@/hooks/usePlayerColor";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

type Song = {
  id: string;
  title: string;
  duration_ms: number | null;
  track_number: number | null;
  artist_name?: string;
  song_artists?: { id: string; name: string; image_url: string | null }[];
  audio_url: string | null;
  preview_url: string | null;
  lyrics?: string | null;
};

type AlbumArtist = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

type AlbumData = {
  id: string;
  title: string;
  album_type: string | null;
  image_url: string | null;
  release_date: string | null;
  album_artists: { artists: AlbumArtist }[];
  songs: Song[];
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AlbumDetailScreen() {
  const { albumId } = useLocalSearchParams<{ albumId: string }>();
  const router = useRouter();
  const { playSong, setQueue, currentSong, isPlaying } = useMusicPlayer();
  const { isLiked } = useLikedSongs();
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendedAlbums, setRecommendedAlbums] = useState<AlbumData[]>([]);
  const [actionRowScreenY, setActionRowScreenY] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [showShuffleSheet, setShowShuffleSheet] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showArtistsSheet, setShowArtistsSheet] = useState(false);
  const [showArtists, setShowArtists] = useState(false);
  const [songOptionArtists, setSongOptionArtists] = useState<
    { id: string; name: string; image_url: string | null }[]
  >([]);

  // ref to the action row for screen-relative measurement
  const actionRowRef = useRef<View>(null);

  // Color from image URL — same palette hash as mini player
  const dominantColor = usePlayerColor(album?.image_url);
  const insets = useSafeAreaInsets();

  // Where the button docks in the sticky header
  const DOCKED_TOP = insets.top + 30;

  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header fades in as action row scrolls off screen
  // actionRowScreenY is in content space, so compare directly against scrollY
  const headerOpacity = scrollY.interpolate({
    inputRange: [
      Math.max(0, actionRowScreenY - 60),
      Math.max(1, actionRowScreenY),
    ],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Background gradient fades out on scroll
  const backgroundOpacity = scrollY.interpolate({
    inputRange: [0, 150, 300],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  // Album cover shrinks and moves up slightly
  const coverScale = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.85],
    extrapolate: "clamp",
  });

  const coverTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -20],
    extrapolate: "clamp",
  });

  // Play button: starts aligned with action row, scrolls up, clamps at docked position.
  // Uses translateY with useNativeDriver:true for smooth 60fps animation.
  const initialTop = 440;
  const scrollThreshold = Math.max(1, initialTop - DOCKED_TOP);
  // translateY goes from 0 → -(initialTop - DOCKED_TOP) as scroll increases
  const playButtonTranslateY = scrollY.interpolate({
    inputRange: [0, scrollThreshold],
    outputRange: [0, -(initialTop - DOCKED_TOP)],
    extrapolate: "clamp",
  });

  useEffect(() => {
    if (!albumId) return;

    const fetchAlbum = async () => {
      setLoading(true);
      try {
        const { data: albumData, error: albumError } = await supabase
          .from("albums")
          .select("id, title, album_type, image_url, release_date")
          .eq("id", albumId)
          .eq("is_active", true)
          .single();

        if (albumError) throw albumError;
        if (!albumData) {
          setAlbum(null);
          setLoading(false);
          return;
        }

        const { data: albumArtistsData, error: artistsError } = await supabase
          .from("album_artists")
          .select("artist_id, artists(id, name, slug, image_url)")
          .eq("album_id", albumId);

        if (artistsError) throw artistsError;

        const { data: songsData, error: songsError } = await supabase
          .from("songs")
          .select(
            "id, title, duration_ms, track_number, audio_url, preview_url, lyrics, song_artists(artists(id, name, image_url))",
          )
          .eq("album_id", albumId)
          .eq("is_active", true)
          .order("track_number", { ascending: true });

        if (songsError) throw songsError;

        const transformedAlbumArtists = (albumArtistsData || []).map(
          (aa: any) => ({
            artists: Array.isArray(aa.artists) ? aa.artists[0] : aa.artists,
          }),
        );

        const transformedSongs = (songsData || []).map((song: any) => {
          const songArtistList =
            Array.isArray(song.song_artists) && song.song_artists.length > 0
              ? song.song_artists.map((sa: any) => sa.artists).filter(Boolean)
              : [];
          return {
            ...song,
            artist_name: songArtistList.map((a: any) => a.name).join(", "),
            song_artists: songArtistList.map((a: any) => ({
              id: a.id,
              name: a.name,
              image_url: a.image_url ?? null,
            })),
          };
        });

        setAlbum({
          ...albumData,
          album_artists: transformedAlbumArtists,
          songs: transformedSongs,
        });

        // Fetch recommended albums (other albums from same artists)
        const artistIds =
          albumArtistsData?.map((aa: any) => aa.artist_id) || [];
        if (artistIds.length > 0) {
          const { data: recommendedData } = await supabase
            .from("album_artists")
            .select(
              "album_id, albums(id, title, album_type, image_url, release_date, album_artists(artists(id, name, slug, image_url)))",
            )
            .in("artist_id", artistIds)
            .neq("album_id", albumId)
            .limit(6);

          const uniqueAlbums = (recommendedData || [])
            .map((item: any) => ({
              ...item.albums,
              album_artists: item.albums.album_artists.map((aa: any) => ({
                artists: aa.artists,
              })),
              songs: [],
            }))
            .filter(
              (album: any, index: number, self: any[]) =>
                index === self.findIndex((a) => a.id === album.id),
            );

          setRecommendedAlbums(uniqueAlbums);
        }
      } catch (err) {
        setAlbum(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [albumId]);

  if (loading) {
    return <LoadingDots />;
  }

  if (!album) {
    return (
      <View className="flex-1 bg-[#121212]">
        <SafeAreaView className="flex-1" edges={["top"]}>
          <View className="flex-1 items-center justify-center px-5">
            <Text className="text-white/70 text-base font-CircularStd mb-4">
              Album not found
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-white text-sm font-CircularStd font-semibold">
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const artists = album.album_artists.map((aa) => aa.artists);
  const MAX_SHOWN = 2;
  const artistsNames =
    artists.length <= MAX_SHOWN
      ? artists.map((a) => a.name).join(" • ")
      : artists
          .slice(0, MAX_SHOWN)
          .map((a) => a.name)
          .join(" • ") + ` +${artists.length - MAX_SHOWN} others`;
  const albumType =
    (album.album_type || "Album").charAt(0).toUpperCase() +
    (album.album_type || "Album").slice(1);

  const totalDuration = album.songs.reduce(
    (acc, song) => acc + (song.duration_ms || 0),
    0,
  );
  const totalMinutes = Math.ceil(totalDuration / 60000);

  const renderHeader = () => (
    <View>
      {/* Back Button */}
      <TouchableOpacity
        className="absolute top-2 left-4 z-10 p-2"
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Album Cover with animation */}
      <Animated.View
        className="items-center mt-8 mb-6"
        style={{
          transform: [{ scale: coverScale }, { translateY: coverTranslateY }],
        }}
      >
        {album.image_url ? (
          <Image
            source={{ uri: album.image_url }}
            className="w-72 h-72 rounded-md shadow-2xl"
            resizeMode="cover"
          />
        ) : (
          <View className="w-72 h-72 rounded-md bg-[#2a2a2a] items-center justify-center">
            <Ionicons name="disc" size={80} color="#535353" />
          </View>
        )}
      </Animated.View>

      {/* Album Info */}
      <View className="px-4">
        {/* Title */}
        <Text className="text-white text-[26px] font-CircularStd mb-3">
          {album.title}
        </Text>

        {/* Artists Row with Avatars — tappable to open artists sheet */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowArtistsSheet(true)}
          className="flex-row items-center mb-1"
        >
          {artists.slice(0, 3).map((artist, index) => (
            <View
              key={artist.id}
              className="-mr-3 rounded-full border-2 border-transparent"
              style={{ zIndex: artists.length - index }}
            >
              {artist.image_url ? (
                <Image
                  source={{ uri: artist.image_url }}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <View className="w-6 h-6 rounded-full bg-[#2a2a2a] items-center justify-center">
                  <Ionicons name="person" size={10} color="#535353" />
                </View>
              )}
            </View>
          ))}
          <Text
            className="text-white/90 text-sm font-CircularStd ml-4"
            numberOfLines={1}
          >
            {artistsNames}
          </Text>
        </TouchableOpacity>

        {/* Meta Info */}
        <Text className="text-white/60 text-[13px] font-CircularStd mb-5 mt-2">
          {albumType}
          {album.release_date ? ` • ${formatDate(album.release_date)}` : ""}
        </Text>

        {/* Action Buttons */}
        <View
          ref={actionRowRef}
          className="flex-row items-center justify-between mb-6 pr-16"
          onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            // y = distance from FlatList content top to this row
            // center of row minus half of play button height (56/2 = 28)
            setActionRowScreenY(y + height / 2 - 28);
          }}
        >
          <View className="flex-row items-center">
            {/* Mini album artwork */}
            {album.image_url && (
              <Image
                source={{ uri: album.image_url }}
                className="w-9 h-9 rounded mr-4"
                resizeMode="cover"
              />
            )}
            {/* Add to Library */}
            <TouchableOpacity className="mr-5">
              <Image
                source={require("@/assets/images/ico-32-plus-circle.png")}
                style={{ width: 26, height: 26, tintColor: "#a7a7a7" }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {/* Download */}
            <TouchableOpacity className="mr-5">
              <Image
                source={require("@/assets/images/ico-24-plus-arrrow-down.png")}
                style={{ width: 26, height: 26, tintColor: "#a7a7a7" }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {/* More options */}
            <TouchableOpacity onPress={() => setShowOptions(true)}>
              <Ionicons name="ellipsis-horizontal" size={26} color="#a7a7a7" />
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center mr-4">
            <TouchableOpacity
              onPress={() => setShowShuffleSheet(true)}
              style={{ alignItems: "center" }}
            >
              <Image
                source={require("@/assets/images/ico-32-shuffle.png")}
                style={{ width: 32, height: 32, tintColor: "#1DB954" }}
                resizeMode="contain"
              />
              {/* Active dot */}
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#1DB954",
                }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Song Count & Duration */}
      <View className="px-4 pb-4">
        <Text className="text-white/50 text-[13px] font-CircularStd">
          {album.songs.length} song{album.songs.length !== 1 ? "s" : ""} •{" "}
          {totalMinutes} min
        </Text>
      </View>
    </View>
  );

  const renderSong = ({ item, index }: { item: Song; index: number }) => {
    const isCurrentSong = currentSong?.id === item.id;
    const songLiked = isLiked(item.id);

    return (
      <TouchableOpacity
        className="flex-row items-center justify-between px-6 py-3"
        onPress={() => {
          // Set queue to all album songs and play this one
          const songsWithAlbumData =
            album?.songs.map((song) => ({
              ...song,
              album_title: album?.title,
              image_url: album?.image_url,
            })) || [];
          setQueue(songsWithAlbumData, index);
          playSong({
            ...item,
            album_title: album?.title,
            image_url: album?.image_url,
          });
        }}
      >
        <View className="flex-1">
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 2,
              paddingRight: 8,
            }}
          >
            {isCurrentSong && (
              <PlayingIndicator
                isPlaying={isPlaying}
                style={{ marginRight: 6 }}
              />
            )}
            <Text
              className={`text-[15px] font-CircularStd font-medium ${
                isCurrentSong ? "text-[#1DB954]" : "text-white"
              }`}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </View>
          <Text
            className="text-white/60 text-[13px] font-CircularStd"
            numberOfLines={1}
          >
            {item.artist_name || artistsNames}
          </Text>
        </View>

        {/* Liked indicator — green tick, visible only when liked */}
        {songLiked && (
          <Ionicons name="checkmark-circle" size={24} color="#1DB954" />
        )}
        <TouchableOpacity
          className="p-2 ml-2"
          onPress={() => {
            setSelectedSong(item);
            setSongOptionArtists(
              item.song_artists?.length
                ? item.song_artists
                : artists.map((a) => ({
                    id: a.id,
                    name: a.name,
                    image_url: a.image_url,
                  })),
            );
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#a7a7a7" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderClipsSection = () => {
    if (artists.length === 0) return null;

    const clipTitles = [
      "Finding Her (New Version)...",
      "Sambhal ke rakha vo phoo...",
      "Ki me kehta raha per tu aa...",
    ];

    return (
      <View style={{ marginTop: 36, paddingHorizontal: 16 }}>
        {/* Section title — large bold, matches image */}
        <Text
          style={{
            color: "#ffffff",
            fontSize: 24,
            fontFamily: "CircularStd",
            fontWeight: "600",
            marginBottom: 16,
          }}
        >
          Clips from {artists[0].name}
        </Text>

        {/* 3 equal-width portrait cards in a row */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {clipTitles.map((title, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                aspectRatio: 9 / 14,
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: "#1e1e1e",
              }}
            >
              {/* Clip thumbnail */}
              <Image
                source={{ uri: album?.image_url || "" }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                resizeMode="cover"
              />

              {/* Bottom gradient overlay */}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.85)"]}
                locations={[0.4, 0.65, 1]}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "60%",
                }}
              />

              {/* Song title at bottom */}
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 13,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                    lineHeight: 18,
                  }}
                  numberOfLines={3}
                >
                  {title}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRecommendedSection = () => {
    if (recommendedAlbums.length === 0) return null;

    return (
      <View style={{ marginTop: 32, paddingLeft: 16 }}>
        <Text
          style={{
            color: "#ffffff",
            fontSize: 22,
            fontFamily: "CircularStd",
            fontWeight: "600",
            marginBottom: 16,
          }}
        >
          You may also like
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16, gap: 12 }}
        >
          {recommendedAlbums.map((recAlbum) => {
            const recArtists =
              recAlbum.album_artists
                ?.map((aa: any) =>
                  typeof aa.artists === "object" ? aa.artists.name : "",
                )
                .filter(Boolean)
                .join(", ") || "Various Artists";

            return (
              <TouchableOpacity
                key={recAlbum.id}
                activeOpacity={0.75}
                onPress={() => router.push(`/album/${recAlbum.id}` as any)}
                style={{ width: 150 }}
              >
                <View
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: 6,
                    overflow: "hidden",
                    marginBottom: 8,
                    backgroundColor: "#282828",
                  }}
                >
                  {recAlbum.image_url ? (
                    <Image
                      source={{ uri: recAlbum.image_url }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="disc" size={48} color="#535353" />
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 14,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                    marginBottom: 2,
                  }}
                  numberOfLines={1}
                >
                  {recAlbum.title}
                </Text>
                <Text
                  style={{
                    color: "#a7a7a7",
                    fontSize: 12,
                    fontFamily: "CircularStd",
                  }}
                  numberOfLines={1}
                >
                  {recArtists}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderFooter = () => (
    <View>
      {renderClipsSection()}
      {renderRecommendedSection()}
    </View>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <Animated.View
        className="absolute top-0 left-0 right-0 z-20"
        style={{ opacity: headerOpacity }}
      >
        {/* Solid color fill covering status bar + header row */}
        <View
          style={{
            backgroundColor: dominantColor,
            paddingTop: insets.top,
            paddingBottom: 12,
            paddingHorizontal: 16,
          }}
        >
          <View className="flex-row items-center pt-5">
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text
              className="text-white text-[17px] font-CircularStd flex-1 text-center font-semibold"
              numberOfLines={1}
            >
              {album.title}
            </Text>
            {/* Spacer to balance the back arrow and keep title truly centered */}
            <View style={{ width: 24 }} />
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={{ opacity: backgroundOpacity }}
        className="absolute top-0 left-0 right-0 h-[650]"
      >
        <LinearGradient
          colors={[
            dominantColor,
            `${dominantColor}cc`,
            `${dominantColor}55`,
            "#121212",
          ]}
          className="absolute top-0 left-0 right-0 h-[650]"
          locations={[0, 0.45, 0.75, 1]}
        />
      </Animated.View>

      {/* Play Button — floats over content, scrolls up and docks into sticky header */}
      <Animated.View
        className="absolute right-4 z-30"
        style={{
          top: initialTop,
          transform: [{ translateY: playButtonTranslateY }],
        }}
      >
        <TouchableOpacity
          style={{
            width: 48,
            height: 48,
            borderRadius: 28,
            backgroundColor: "#1DB954",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#1DB954",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.55,
            shadowRadius: 10,
            elevation: 12,
          }}
          onPress={() => {
            // Play first song of album
            if (album?.songs && album.songs.length > 0) {
              const songsWithAlbumData = album.songs.map((song) => ({
                ...song,
                album_title: album.title,
                image_url: album.image_url,
              }));
              setQueue(songsWithAlbumData, 0);
              playSong(songsWithAlbumData[0]);
            }
          }}
        >
          <Image
            source={require("@/assets/images/ico-32-play.png")}
            style={{ width: 28, height: 28, tintColor: "#000000" }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Animated.View>

      <SafeAreaView className="flex-1" edges={["top"]}>
        <Animated.FlatList
          data={album.songs}
          keyExtractor={(item) => item.id}
          renderItem={renderSong}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
        />
      </SafeAreaView>

      <AlbumOptionsSheet
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        albumTitle={album.title}
        artistNames={artists.map((a) => a.name).join(", ")}
        imageUrl={album.image_url}
      />

      <ShuffleSheet
        visible={showShuffleSheet}
        onClose={() => setShowShuffleSheet(false)}
      />

      {/* Song options bottom sheet */}
      <SongOptionsSheet
        visible={selectedSong !== null}
        onClose={() => setSelectedSong(null)}
        onShowArtists={() => {
          setShowArtists(true);
        }}
        songId={selectedSong?.id ?? null}
        songTitle={selectedSong?.title ?? ""}
        artistName={selectedSong?.artist_name ?? artistsNames}
        albumTitle={album.title}
        imageUrl={album.image_url}
        artists={
          selectedSong?.song_artists && selectedSong.song_artists.length > 0
            ? selectedSong.song_artists
            : artists.map((a) => ({
                id: a.id,
                name: a.name,
                image_url: a.image_url,
              }))
        }
      />

      {/* Artists sheet — opened from song options */}
      <ArtistsSheet
        visible={showArtists}
        onClose={() => setShowArtists(false)}
        artists={songOptionArtists}
      />

      {/* Artists sheet — opened from artists row */}
      <ArtistsSheet
        visible={showArtistsSheet}
        onClose={() => setShowArtistsSheet(false)}
        artists={artists.map((a) => ({
          id: a.id,
          name: a.name,
          image_url: a.image_url,
        }))}
      />
    </View>
  );
}
