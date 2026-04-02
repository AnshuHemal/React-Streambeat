import LoadingDots from "@/components/LoadingDots";
import { fallbackAlbumColor, useExtractedColor } from "@/hooks/useImageColor";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");
const HERO_H = SCREEN_W * 0.95; // reduced from 1.05

type ArtistData = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  monthly_listeners?: number | null;
  description?: string | null;
};

type SongItem = {
  id: string;
  title: string;
  image_url: string | null;
  play_count?: number | null;
  track_number?: number | null;
};

function formatCount(n: number | null | undefined): string {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

const DUMMY_SONGS: SongItem[] = [
  { id: "d1", title: "Finding Her", image_url: null, play_count: 390668616 },
  {
    id: "d2",
    title: "Finding Her (Female Version)",
    image_url: null,
    play_count: 29356464,
  },
  { id: "d3", title: "Dard", image_url: null, play_count: 46795157 },
  { id: "d4", title: "Baawra", image_url: null, play_count: 39168147 },
  { id: "d5", title: "Pyar Se", image_url: null, play_count: 1727053 },
  { id: "d6", title: "Main Kho Gaya", image_url: null, play_count: 10550774 },
  {
    id: "d7",
    title: "Teri Aankhon Mein",
    image_url: null,
    play_count: 8234561,
  },
  {
    id: "d8",
    title: "Kho Gaye Hum Kahan",
    image_url: null,
    play_count: 6789012,
  },
  { id: "d9", title: "Tere Bina", image_url: null, play_count: 5432198 },
  { id: "d10", title: "Woh Lamhe", image_url: null, play_count: 3210987 },
];

type ClipItem = {
  id: string;
  title: string;
  image_url: string | null;
};

const DUMMY_CLIPS: ClipItem[] = [
  { id: "c1", title: "Finding Her (New Version)...", image_url: null },
  { id: "c2", title: "Sambhal ke rakha vo phoo...", image_url: null },
  { id: "c3", title: "Ki me kehta raha per tu aa...", image_url: null },
];

type ReleaseItem = {
  id: string;
  title: string;
  type: string;
  year: string;
  image_url: string | null;
  isLatest?: boolean;
};

const DUMMY_ARTIST_PICK = {
  title: "Pyar Se",
  subtitle: "Single • New Release",
  postedBy: "Kushagra",
  image_url: null,
  bg_image_url: null,
};

const DUMMY_RELEASES: ReleaseItem[] = [
  {
    id: "r1",
    title: "Pyar Se",
    type: "Single",
    year: "2026",
    image_url: null,
    isLatest: true,
  },
  {
    id: "r2",
    title: "Finding Her",
    type: "Single",
    year: "2025",
    image_url: null,
  },
  {
    id: "r3",
    title: "Finding Her (Female Version)",
    type: "Single",
    year: "2025",
    image_url: null,
  },
  { id: "r4", title: "Dard", type: "Album", year: "2024", image_url: null },
  { id: "r5", title: "Baawra", type: "Single", year: "2024", image_url: null },
];

type FeaturingItem = {
  id: string;
  title: string;
  subtitle: string;
  type: "playlist" | "radio";
  image_url: string | null;
  bgColor?: string;
};

const DUMMY_FEATURING: FeaturingItem[] = [
  {
    id: "f1",
    title: "This is Kushagra",
    subtitle: "This is Kushagra. The essential tracks, all in one playlist.",
    type: "playlist",
    image_url: null,
    bgColor: "#ff6b4a",
  },
  {
    id: "f2",
    title: "Kushagra Radio",
    subtitle: "Anuv Jain, Faheem Abdullah, Kushagra, Pare...",
    type: "radio",
    image_url: null,
    bgColor: "#ff85a2",
  },
  {
    id: "f3",
    title: "Hot Hits",
    subtitle: "Arijit Singh, Neha Kakkar, Badshah...",
    type: "playlist",
    image_url: null,
    bgColor: "#ffd700",
  },
];

type PlaylistItem = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
};

const DUMMY_PLAYLISTS: PlaylistItem[] = [
  {
    id: "p1",
    title: "This is Kushagra",
    subtitle: "This is Kushagra. The essential tracks, all in one...",
    image_url: null,
  },
  {
    id: "p2",
    title: "Pop & Chill",
    subtitle: "Topsify India",
    image_url: null,
  },
  {
    id: "p3",
    title: "Anuv Jain",
    subtitle: "Abdullah",
    image_url: null,
  },
];

type FanLikeItem = {
  id: string;
  name: string;
  image_url: string | null;
};

const DUMMY_FANS_LIKE: FanLikeItem[] = [
  {
    id: "fl1",
    name: "Bharath",
    image_url: null,
  },
  {
    id: "fl2",
    name: "Saaheal",
    image_url: null,
  },
  {
    id: "fl3",
    name: "Anuv Jain",
    image_url: null,
  },
];

export default function ArtistScreen() {
  const { artistId } = useLocalSearchParams<{ artistId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<"music" | "clips">("music");
  const [showAllSongs, setShowAllSongs] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [HERO_H - 80, HERO_H - 20],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Hero image fades out as you scroll up
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HERO_H * 0.6],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.1, 1],
    extrapolate: "clamp",
  });

  // Back button circle bg: visible over hero, fades to transparent when header appears
  const backBtnBg = headerOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(0,0,0,0.35)", "rgba(0,0,0,0)"],
    extrapolate: "clamp",
  });

  // Extract dominant color directly from artist image URL
  const extractedColor = useExtractedColor(artist?.image_url);
  const dominantColor =
    extractedColor !== "#1a1a1a"
      ? extractedColor
      : fallbackAlbumColor(artistId ?? "");

  useEffect(() => {
    if (!artistId) return;
    const fetch = async () => {
      setLoading(true);
      try {
        // Fetch artist — select only columns that definitely exist
        const { data: artistData, error: artistError } = await supabase
          .from("artists")
          .select("id, name, slug, image_url, description")
          .eq("id", artistId)
          .single();

        if (artistError) throw artistError;

        // Try to get monthly_listeners if the column exists
        let monthlyListeners: number | null = null;
        try {
          const { data: extData } = await supabase
            .from("artists")
            .select("monthly_listeners")
            .eq("id", artistId)
            .single();
          monthlyListeners = extData?.monthly_listeners ?? null;
        } catch {
          // column doesn't exist — ignore
        }

        setArtist(
          artistData
            ? { ...artistData, monthly_listeners: monthlyListeners }
            : null,
        );

        // Try song_artists junction first, fall back to direct artist_id
        let songsData: SongItem[] | null = null;
        try {
          const { data: junctionData } = await supabase
            .from("song_artists")
            .select("songs(id, title, image_url, play_count, track_number)")
            .eq("artist_id", artistId)
            .limit(10);

          if (junctionData && junctionData.length > 0) {
            songsData = junctionData
              .map((row: any) => row.songs)
              .filter(Boolean)
              .sort(
                (a: any, b: any) => (b.play_count ?? 0) - (a.play_count ?? 0),
              );
          }
        } catch {
          // junction table doesn't exist
        }

        // Fallback: direct artist_id on songs
        if (!songsData || songsData.length === 0) {
          const { data: directData } = await supabase
            .from("songs")
            .select("id, title, image_url, play_count, track_number")
            .eq("artist_id", artistId)
            .eq("is_active", true)
            .order("play_count", { ascending: false })
            .limit(10);
          songsData = directData ?? [];
        }

        setSongs(songsData && songsData.length > 0 ? songsData : DUMMY_SONGS);
        setClips(DUMMY_CLIPS);
      } catch (e) {
        console.error("Artist fetch error:", e);
        setArtist(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [artistId]);

  if (loading) {
    return <LoadingDots />;
  }

  if (!artist) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#121212",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#a7a7a7", fontFamily: "CircularStd" }}>
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

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      {/* Persistent back button — always visible regardless of scroll */}
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

      {/* Sticky header — only title fades in on scroll, no back button here */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          opacity: headerOpacity,
        }}
      >
        <View
          style={{
            backgroundColor: dominantColor,
            paddingTop: insets.top,
            paddingBottom: 0,
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: 52,
            }}
          >
            {/* Spacer matching back button width */}
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

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {/* Hero image */}
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
              resizeMode="cover"
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
          {/* Gradient overlay */}
          <LinearGradient
            colors={["transparent", "rgba(18,18,18,0.6)", "#121212"]}
            locations={[0.4, 0.75, 1]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: HERO_H * 0.55,
            }}
          />
          {/* Artist name + listeners */}
          <View
            style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 34,
                fontFamily: "CircularStd",
                fontWeight: "600",
                marginBottom: 4,
              }}
              numberOfLines={1}
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

        {/* Action row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {/* Latest release thumbnail */}
            {songs[0]?.image_url && (
              <Image
                source={{ uri: songs[0].image_url }}
                style={{ width: 40, height: 40, borderRadius: 4 }}
                resizeMode="cover"
              />
            )}
            {/* Follow button */}
            <TouchableOpacity
              onPress={() => setIsFollowing(!isFollowing)}
              style={{
                borderWidth: 1,
                borderColor: isFollowing ? "transparent" : "#ffffff",
                backgroundColor: isFollowing ? "#1DB954" : "transparent",
                borderRadius: 20,
                paddingHorizontal: 20,
                paddingVertical: 8,
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
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
            {/* More */}
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={22} color="#a7a7a7" />
            </TouchableOpacity>
          </View>
          {/* Shuffle + Play */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <TouchableOpacity>
              <Image
                source={require("@/assets/images/ico-32-shuffle.png")}
                style={{ width: 26, height: 26, tintColor: "#1DB954" }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsPlaying(!isPlaying)}
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
                  isPlaying
                    ? require("@/assets/images/ico-32-pause.png")
                    : require("@/assets/images/ico-32-play.png")
                }
                style={{ width: 26, height: 26, tintColor: "#000000" }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Music / Clips tabs */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            marginBottom: 20,
            gap: 24,
          }}
        >
          {(["music", "clips"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{ paddingBottom: 8 }}
            >
              <Text
                style={{
                  color: activeTab === tab ? "#ffffff" : "#a7a7a7",
                  fontSize: 15,
                  fontFamily: "CircularStd",
                  fontWeight: activeTab === tab ? "600" : "400",
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {activeTab === tab && (
                <View
                  style={{
                    height: 2,
                    backgroundColor: "#1DB954",
                    borderRadius: 1,
                    marginTop: 4,
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "music" && (
          <View>
            {/* Popular section */}
            <Text
              style={{
                color: "#ffffff",
                fontSize: 22,
                fontFamily: "CircularStd",
                fontWeight: "600",
                paddingHorizontal: 16,
                marginBottom: 12,
              }}
            >
              Popular
            </Text>
            {songs.map((song, index) => {
              // Default: show 5 fully, 6th dimmed as peek; expanded: show all
              const isVisible = showAllSongs ? true : index < 6;
              const isDimmed = !showAllSongs && index === 5;
              if (!isVisible) return null;
              return (
                <TouchableOpacity
                  key={song.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    opacity: isDimmed ? 0.4 : 1,
                  }}
                  activeOpacity={0.7}
                >
                  {/* Track number */}
                  <Text
                    style={{
                      color: "#a7a7a7",
                      fontSize: 15,
                      fontFamily: "CircularStd",
                      width: 24,
                      textAlign: "center",
                      marginRight: 12,
                    }}
                  >
                    {index + 1}
                  </Text>
                  {/* Album art */}
                  {song.image_url ? (
                    <Image
                      source={{ uri: song.image_url }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 4,
                        marginRight: 14,
                      }}
                      resizeMode="cover"
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
                        color: "#ffffff",
                        fontSize: 15,
                        fontFamily: "CircularStd",
                        fontWeight: "600",
                        marginBottom: 3,
                      }}
                      numberOfLines={1}
                    >
                      {song.title}
                    </Text>
                    <Text
                      style={{
                        color: "#a7a7a7",
                        fontSize: 13,
                        fontFamily: "CircularStd",
                      }}
                    >
                      {formatCount(song.play_count)}
                    </Text>
                  </View>
                  {/* More */}
                  <TouchableOpacity style={{ padding: 8 }}>
                    <Ionicons
                      name="ellipsis-vertical"
                      size={18}
                      color={isDimmed ? "#535353" : "#a7a7a7"}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}

            {/* See more / See less button */}
            {songs.length > 5 && (
              <View
                style={{ alignItems: "center", marginTop: 16, marginBottom: 8 }}
              >
                <TouchableOpacity
                  onPress={() => setShowAllSongs(!showAllSongs)}
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

        {activeTab === "clips" && (
          <View style={{ paddingHorizontal: 16 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {clips.map((clip, i) => (
                <TouchableOpacity
                  key={clip.id}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    aspectRatio: 9 / 14,
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: "#1e1e1e",
                  }}
                >
                  {clip.image_url ? (
                    <Image
                      source={{ uri: clip.image_url }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: `hsl(${(i * 80 + 200) % 360}, 30%, 20%)`,
                      }}
                    />
                  )}
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    locations={[0.5, 1]}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "50%",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        fontSize: 12,
                        fontFamily: "CircularStd",
                        fontWeight: "600",
                        lineHeight: 16,
                      }}
                      numberOfLines={3}
                    >
                      {clip.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Artist Pick ─────────────────────────────────────── */}
        <View style={{ marginTop: 36, paddingHorizontal: 16 }}>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 22,
              fontFamily: "CircularStd",
              fontWeight: "600",
              marginBottom: 14,
            }}
          >
            Artist Pick
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={{
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#1e1e1e",
            }}
          >
            {/* Background image area */}
            <View
              style={{
                height: 220,
                backgroundColor: "#2a2a2a",
                justifyContent: "flex-end",
              }}
            >
              {DUMMY_ARTIST_PICK.bg_image_url ? (
                <Image
                  source={{ uri: DUMMY_ARTIST_PICK.bg_image_url }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "#2a2a2a",
                  }}
                />
              )}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 100,
                }}
              />
              {/* Posted by badge */}
              <View
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "#1DB954",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="musical-note" size={12} color="#000" />
                </View>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 12,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                  }}
                >
                  Posted by {DUMMY_ARTIST_PICK.postedBy}
                </Text>
              </View>
              {/* Album info row at bottom */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 6,
                    backgroundColor: "#3a3a3a",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="disc" size={32} color="#535353" />
                </View>
                <View>
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 18,
                      fontFamily: "CircularStd",
                      fontWeight: "600",
                    }}
                  >
                    {DUMMY_ARTIST_PICK.title}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 13,
                      fontFamily: "CircularStd",
                      marginTop: 2,
                    }}
                  >
                    {DUMMY_ARTIST_PICK.subtitle}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Popular releases ────────────────────────────────── */}
        <View
          style={{ marginTop: 36, paddingHorizontal: 16, marginBottom: 24 }}
        >
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
          {DUMMY_RELEASES.map((release) => (
            <TouchableOpacity
              key={release.id}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              {/* Album art */}
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 4,
                  backgroundColor: "#2a2a2a",
                  marginRight: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {release.image_url ? (
                  <Image
                    source={{ uri: release.image_url }}
                    style={{ width: 80, height: 80 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="disc" size={32} color="#535353" />
                )}
              </View>
              {/* Info */}
              <View style={{ flex: 1 }}>
                {release.isLatest && (
                  <Text
                    style={{
                      color: "#a7a7a7",
                      fontSize: 12,
                      fontFamily: "CircularStd",
                      marginBottom: 2,
                    }}
                  >
                    Latest release
                  </Text>
                )}
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                    marginBottom: 2,
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
                  {release.type} • {release.year}
                </Text>
              </View>
              <TouchableOpacity style={{ padding: 8 }}>
                <Ionicons name="ellipsis-vertical" size={18} color="#a7a7a7" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          {/* See discography button at the end */}
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: "#ffffff",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 6,
              alignSelf: "center",
              marginTop: 8,
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 13,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              See discography
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Featuring [Artist Name] ─────────────────────────── */}
        <View style={{ marginTop: 26 }}>
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
            Featuring {artist?.name || "Artist"}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {DUMMY_FEATURING.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={{
                  width: 160,
                }}
              >
                <View
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: 8,
                    backgroundColor: "#282828",
                    overflow: "hidden",
                    marginBottom: 8,
                  }}
                >
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={{ width: 160, height: 160 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 160,
                        height: 160,
                        backgroundColor: item.bgColor || "#1e1e1e",
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 14,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                  }}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    color: "#a7a7a7",
                    fontSize: 12,
                    fontFamily: "CircularStd",
                    marginTop: 2,
                  }}
                  numberOfLines={2}
                >
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Clips from [Artist Name] ──────────────────────── */}
        <View style={{ marginTop: 36 }}>
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
            Clips from {artist?.name || "Artist"}
          </Text>
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 16,
              gap: 8,
            }}
          >
            {DUMMY_CLIPS.map((clip, i) => (
              <TouchableOpacity
                key={clip.id}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  aspectRatio: 9 / 14,
                  borderRadius: 10,
                  overflow: "hidden",
                  backgroundColor: "#1e1e1e",
                }}
              >
                {clip.image_url ? (
                  <Image
                    source={{ uri: clip.image_url }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: `hsl(${(i * 80 + 200) % 360}, 30%, 20%)`,
                    }}
                  />
                )}
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.8)"]}
                  locations={[0.5, 1]}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "50%",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: 8,
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 12,
                      fontFamily: "CircularStd",
                      fontWeight: "600",
                      lineHeight: 16,
                    }}
                    numberOfLines={3}
                  >
                    {clip.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── About ─────────────────────────────────────────── */}
        <View style={{ marginTop: 36, paddingHorizontal: 16 }}>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 22,
              fontFamily: "CircularStd",
              fontWeight: "600",
              marginBottom: 12,
            }}
          >
            About
          </Text>
          <View
            style={{
              backgroundColor: "#282828",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {/* Artist Image */}
            <Image
              source={{ uri: artist?.image_url || "" }}
              style={{
                width: "100%",
                height: 240,
              }}
              resizeMode="cover"
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
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 26,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                    letterSpacing: -0.5,
                  }}
                >
                  {artist?.name || "Artist"}
                </Text>
                <Text
                  style={{
                    color: "#a7a7a7",
                    fontSize: 13,
                    fontFamily: "CircularStd",
                    marginTop: 2,
                  }}
                >
                  {formatCount(artist?.monthly_listeners || 11800000)} monthly listeners
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFollowing(!isFollowing)}
                style={{
                  borderWidth: 1,
                  borderColor: isFollowing ? "#1DB954" : "#ffffff",
                  backgroundColor: isFollowing ? "#1DB954" : "transparent",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 13,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                  }}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            </View>
            {/* Description */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 14,
                  fontFamily: "CircularStd",
                  lineHeight: 20,
                }}
                numberOfLines={3}
              >
                {artist?.description || `${artist?.name || "Artist"} is an emerging artist making waves in the music industry.`}{" "}
                <Text style={{ color: "#ffffff", fontWeight: "600" }}>
                  see more
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* ── Artist Playlists ──────────────────────────────── */}
        <View style={{ marginTop: 36 }}>
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
            Artist Playlists
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
          >
            {DUMMY_PLAYLISTS.map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                activeOpacity={0.7}
                style={{ width: 144 }}
              >
                <View
                  style={{
                    width: 144,
                    height: 144,
                    borderRadius: 6,
                    backgroundColor: "#282828",
                    marginBottom: 8,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    source={{ uri: playlist.image_url || "" }}
                    style={{
                      width: 144,
                      height: 144,
                    }}
                    resizeMode="cover"
                  />
                </View>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 12,
                    fontFamily: "CircularStd",
                    fontWeight: "500",
                  }}
                  numberOfLines={2}
                >
                  {playlist.title}
                </Text>
                <Text
                  style={{
                    color: "#B3B3B3",
                    fontSize: 12,
                    fontFamily: "CircularStd",
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {playlist.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Fans also like ────────────────────────────────── */}
        <View style={{ marginTop: 36, marginBottom: 24 }}>
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
            {DUMMY_FANS_LIKE.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                style={{ width: 140, alignItems: "center" }}
              >
                <View
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: 70,
                    backgroundColor: "#282828",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                    overflow: "hidden",
                  }}
                >
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={{
                        width: 140,
                        height: 140,
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={50} color="#535353" />
                  )}
                </View>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 12,
                    fontFamily: "CircularStd",
                    fontWeight: "500",
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
