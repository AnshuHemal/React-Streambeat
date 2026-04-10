import ProfileDrawerContent from "@/components/ProfileDrawer";
import TabScreenHeader from "@/components/TabScreenHeader";
import { FeaturedBanner } from "@/components/home/FeaturedBanner";
import { HomeAlbumCard } from "@/components/home/HomeAlbumCard";
import { HomeArtistCard } from "@/components/home/HomeArtistCard";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HomeSongCard } from "@/components/home/HomeSongCard";
import { QuickItemTile } from "@/components/home/QuickItemTile";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { useHomeData } from "@/hooks/useHomeData";
import { useExtractedColor } from "@/hooks/useImageColor";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
    Animated,
    BackHandler,
    Dimensions,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { SafeAreaView } from "react-native-safe-area-context";

const FILTER_TABS = ["All", "Music"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard({
  width = 144,
  height = 144,
}: {
  width?: number;
  height?: number;
}) {
  const anim = useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius: 6,
        backgroundColor: "#282828",
        opacity: anim,
        marginRight: 16,
      }}
    />
  );
}

function SkeletonRow() {
  return (
    <View style={{ marginBottom: 32 }}>
      <View
        style={{
          height: 24,
          width: 160,
          backgroundColor: "#282828",
          borderRadius: 4,
          marginHorizontal: 20,
          marginBottom: 14,
          opacity: 0.6,
        }}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const { currentSong, playSong, setQueue } = useMusicPlayer();

  const {
    quickItems,
    recentlyPlayed,
    followedArtists,
    newReleases,
    popularAlbums,
    personalizedSongs,
    personalizedArtistName,
    featuredItem,
    timeContext,
    loading,
    refetch,
  } = useHomeData();

  // Gradient color from first recently played album
  const heroImageUrl = recentlyPlayed[0]?.image_url ?? null;
  const extractedColor = useExtractedColor(heroImageUrl);
  const gradientColor =
    extractedColor !== "#1a1a1a" ? extractedColor : "#1a1a2e";

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      refetch();
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (open) {
          setOpen(false);
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [open, refetch]),
  );

  // Fade-in when data loads
  const fadeAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [loading]);

  // Navigation helpers
  const goAlbum = useCallback(
    (id: string) => router.push(`/album/${id}` as any),
    [router],
  );
  const goArtist = useCallback(
    (id: string) => router.push(`/artist/${id}` as any),
    [router],
  );

  // Play personalized song
  const handleSongPress = useCallback(
    (index: number) => {
      const queue = personalizedSongs.map((s) => ({
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
      setQueue(queue, index, "HOME");
      playSong(queue[index] as any);
    },
    [personalizedSongs, setQueue, playSong],
  );

  const quickGrid = quickItems.slice(0, 6);

  return (
    <Drawer
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      drawerPosition="left"
      drawerType="slide"
      drawerStyle={{
        backgroundColor: "#1a1a1a",
        width: Dimensions.get("window").width * 0.88,
      }}
      renderDrawerContent={() => (
        <ProfileDrawerContent onClose={() => setOpen(false)} />
      )}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#121212" }}
        edges={["top"]}
      >
        {/* Scroll-based gradient header */}
        {!loading && (
          <LinearGradient
            colors={[gradientColor, `${gradientColor}88`, "#121212"]}
            locations={[0, 0.5, 1]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 320,
              zIndex: 0,
            }}
            pointerEvents="none"
          />
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          style={{ zIndex: 1 }}
        >
          {/* Header */}
          <TabScreenHeader
            title={timeContext.greeting}
            onAvatarPress={() => setOpen(true)}
            rightIcon="notifications-outline"
            onRightPress={() => router.push("/admin" as any)}
          />

          {/* Filter tabs */}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              paddingHorizontal: 20,
              marginBottom: 20,
            }}
          >
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveFilter(tab)}
                  activeOpacity={0.8}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isActive
                      ? "#1DB954"
                      : "rgba(255,255,255,0.15)",
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? "#000000" : "#ffffff",
                      fontFamily: "CircularStd",
                      fontSize: 14,
                      fontWeight: isActive ? "600" : "500",
                    }}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Quick access grid ── */}
          {loading ? (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                paddingHorizontal: 12,
                gap: 8,
                marginBottom: 32,
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={{ width: "47%" }}>
                  <SkeletonCard width={144} height={56} />
                </View>
              ))}
            </View>
          ) : quickGrid.length > 0 ? (
            <Animated.View
              style={{
                opacity: fadeAnim,
                flexDirection: "row",
                flexWrap: "wrap",
                paddingHorizontal: 12,
                gap: 8,
                marginBottom: 32,
              }}
            >
              {quickGrid.map((item) => (
                <View key={item.id} style={{ width: "47%" }}>
                  <QuickItemTile
                    item={item}
                    onPress={() => {
                      if (item.kind === "liked-songs")
                        router.push("/liked-songs" as any);
                      else if (item.kind === "album") goAlbum(item.id);
                      else goArtist(item.id);
                    }}
                  />
                </View>
              ))}
            </Animated.View>
          ) : null}

          {/* ── Featured banner (editor's pick) ── */}
          {!loading && featuredItem && (
            <Animated.View style={{ opacity: fadeAnim }}>
              <FeaturedBanner
                item={featuredItem}
                onPress={() => {
                  if (featuredItem.link_type === "album")
                    goAlbum(featuredItem.link_id);
                  else goArtist(featuredItem.link_id);
                }}
              />
            </Animated.View>
          )}

          {/* ── Jump back in ── */}
          {loading ? (
            <SkeletonRow />
          ) : recentlyPlayed.length > 0 ? (
            <Animated.View style={{ opacity: fadeAnim, marginBottom: 32 }}>
              <HomeSectionHeader title="Jump back in" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              >
                {recentlyPlayed.map((album) => (
                  <HomeAlbumCard
                    key={album.id}
                    album={album}
                    onPress={() => goAlbum(album.id)}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          ) : null}

          {/* ── Based on [artist] — personalized songs ── */}
          {!loading && personalizedSongs.length > 0 && (
            <Animated.View style={{ opacity: fadeAnim, marginBottom: 32 }}>
              <HomeSectionHeader
                title={
                  personalizedArtistName
                    ? `Based on ${personalizedArtistName}`
                    : timeContext.sectionTitle
                }
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              >
                {personalizedSongs.map((song, idx) => (
                  <HomeSongCard
                    key={song.id}
                    song={song}
                    isActive={currentSong?.id === song.id}
                    onPress={() => handleSongPress(idx)}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* ── Your artists ── */}
          {!loading && followedArtists.length > 0 && (
            <Animated.View style={{ opacity: fadeAnim, marginBottom: 32 }}>
              <HomeSectionHeader title="Your artists" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 20 }}
              >
                {followedArtists.map((artist) => (
                  <HomeArtistCard
                    key={artist.id}
                    artist={artist}
                    onPress={() => goArtist(artist.id)}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* ── New releases for you ── */}
          {loading ? (
            <SkeletonRow />
          ) : newReleases.length > 0 ? (
            <Animated.View style={{ opacity: fadeAnim, marginBottom: 32 }}>
              <HomeSectionHeader title="New releases for you" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              >
                {newReleases.map((album) => (
                  <HomeAlbumCard
                    key={album.id}
                    album={album}
                    onPress={() => goAlbum(album.id)}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          ) : null}

          {/* ── Popular right now ── */}
          {loading ? (
            <SkeletonRow />
          ) : popularAlbums.length > 0 ? (
            <Animated.View style={{ opacity: fadeAnim, marginBottom: 32 }}>
              <HomeSectionHeader title="Popular right now" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              >
                {popularAlbums.map((album) => (
                  <HomeAlbumCard
                    key={album.id}
                    album={album}
                    onPress={() => goAlbum(album.id)}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Drawer>
  );
}
