import LoadingDots from "@/components/LoadingDots";
import ProfileDrawerContent from "@/components/ProfileDrawer";
import TabScreenHeader from "@/components/TabScreenHeader";
import { supabase } from "@/lib/supabase";
import { SearchCategory, SearchMood } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    BackHandler,
    Dimensions,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: W } = Dimensions.get("window");
const CATEGORY_CARD_W = (W - 48) / 2;
const MOOD_CARD_W = W * 0.38;

// ── Mood card with looping video ──────────────────────────────
function MoodCard({ item }: { item: SearchMood }) {
  const player = useVideoPlayer(item.video_url ?? "", (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View
      style={{
        width: MOOD_CARD_W,
        height: MOOD_CARD_W * 1.4,
        borderRadius: 10,
        overflow: "hidden",
        marginRight: 12,
        backgroundColor: "#2a2a2a",
      }}
    >
      {item.video_url ? (
        <VideoView
          player={player}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          nativeControls={false}
        />
      ) : item.thumbnail_url ? (
        <Image
          source={{ uri: item.thumbnail_url }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: "#333" }} />
      )}

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 10,
          backgroundColor: "rgba(0,0,0,0.35)",
        }}
      >
        <Text
          style={{
            color: "#ffffff",
            fontFamily: "CircularStd",
            fontSize: 13,
            fontWeight: "600",
          }}
        >
          {item.label}
        </Text>
      </View>
    </View>
  );
}

// ── Category card ─────────────────────────────────────────────
function CategoryCard({ item }: { item: SearchCategory }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={{
        width: CATEGORY_CARD_W,
        height: 100,
        borderRadius: 8,
        backgroundColor: item.color,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          color: "#ffffff",
          fontFamily: "CircularStd",
          fontSize: 15,
          fontWeight: "600",
          zIndex: 1,
        }}
      >
        {item.label}
      </Text>

      {item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          style={{
            position: "absolute",
            bottom: -8,
            right: -8,
            width: 72,
            height: 72,
            transform: [{ rotate: "20deg" }],
          }}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────
export default function SearchScreen() {
  const [open, setOpen] = useState(false);
  const [moods, setMoods] = useState<SearchMood[]>([]);
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [loadingMoods, setLoadingMoods] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const router = useRouter();

  // Only active when this tab is focused
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (open) {
          setOpen(false);
          return true;
        }
        router.navigate("/(tabs)" as any);
        return true;
      });
      return () => sub.remove();
    }, [open]),
  );

  useEffect(() => {
    supabase
      .from("search_moods")
      .select("id, slug, label, video_url, thumbnail_url")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setMoods(data ?? []);
        setLoadingMoods(false);
      });

    supabase
      .from("search_categories")
      .select("id, slug, label, color, image_url")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setCategories(data ?? []);
        setLoadingCategories(false);
      });
  }, []);

  const categoryPairs = useMemo(() => {
    const pairs: SearchCategory[][] = [];
    for (let i = 0; i < categories.length; i += 2) {
      pairs.push(categories.slice(i, i + 2));
    }
    return pairs;
  }, [categories]);

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
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Header — same pattern as home, camera icon on right */}
          <TabScreenHeader
            title="Search"
            onAvatarPress={() => setOpen(true)}
            rightIcon="camera-outline"
          />

          {/* Search bar — tappable, navigates to search-input screen */}
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <TouchableOpacity
              onPress={() => router.push("/search-input" as any)}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#ffffff",
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 14,
                gap: 10,
              }}
            >
              <Ionicons name="search" size={20} color="#535353" />
              <Text
                style={{
                  color: "#535353",
                  fontFamily: "CircularStd",
                  fontSize: 15,
                }}
              >
                What do you want to play?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Explore your musical type - only show if data exists */}
          {(loadingMoods || moods.length > 0) && (
            <View style={{ marginBottom: 28 }}>
              <Text
                style={{
                  color: "#ffffff",
                  fontFamily: "CircularStd",
                  fontSize: 16,
                  fontWeight: "600",
                  paddingHorizontal: 20,
                  marginBottom: 14,
                }}
              >
                Explore your musical type
              </Text>
              {loadingMoods ? (
                <View
                  style={{
                    height: MOOD_CARD_W * 1.4,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LoadingDots inline />
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                  {moods.map((mood) => (
                    <MoodCard key={mood.id} item={mood} />
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Browse all - only show if data exists */}
          {(loadingCategories || categories.length > 0) && (
            <View style={{ paddingHorizontal: 20 }}>
              <Text
                style={{
                  color: "#ffffff",
                  fontFamily: "CircularStd",
                  fontSize: 16,
                  fontWeight: "600",
                  marginBottom: 14,
                }}
              >
                Browse all
              </Text>
              {loadingCategories ? (
                <View
                  style={{
                    height: 200,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LoadingDots inline />
                </View>
              ) : (
                categoryPairs.map((pair, i) => (
                  <View key={i} style={{ flexDirection: "row", gap: 12 }}>
                    {pair.map((cat) => (
                      <CategoryCard key={cat.id} item={cat} />
                    ))}
                    {pair.length === 1 && (
                      <View style={{ width: CATEGORY_CARD_W }} />
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Drawer>
  );
}
