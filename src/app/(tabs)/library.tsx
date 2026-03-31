import ProfileDrawerContent from "@/components/ProfileDrawer";
import TabScreenHeader from "@/components/TabScreenHeader";
import { LibraryItem, LibraryItemType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: W } = Dimensions.get("window");
const ITEM_W = (W - 40 - 16) / 3;

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FILTERS: { label: string; value: LibraryItemType | "all" }[] = [
  { label: "Playlists", value: "playlist" },
  { label: "Podcasts", value: "podcast" },
  { label: "Albums", value: "album" },
  { label: "Artists", value: "artist" },
];

const MOCK_ITEMS: LibraryItem[] = [
  {
    id: "1",
    title: "Liked Songs",
    subtitle: "Playlist • 16 songs",
    type: "playlist",
    image_url: null,
  },
  {
    id: "2",
    title: "Your Episodes",
    subtitle: "Saved & downloaded",
    type: "podcast",
    image_url: null,
  },
  {
    id: "3",
    title: "Arctic Monkeys",
    subtitle: "Artist",
    type: "artist",
    image_url: null,
    is_circular: true,
  },
  {
    id: "4",
    title: "Blur",
    subtitle: "Artist",
    type: "artist",
    image_url: null,
    is_circular: true,
  },
  {
    id: "5",
    title: "Brit Pop: 100 best songs",
    subtitle: "Playlist",
    type: "playlist",
    image_url: null,
  },
  {
    id: "6",
    title: "David Bowie",
    subtitle: "Artist",
    type: "artist",
    image_url: null,
    is_circular: true,
  },
  {
    id: "7",
    title: "Leisure (Special Edition)",
    subtitle: "Album • Blur",
    type: "album",
    image_url: null,
  },
  {
    id: "8",
    title: "The Ballad of Darren",
    subtitle: "Album • Blur",
    type: "album",
    image_url: null,
  },
  {
    id: "9",
    title: "Solved Murders: True Crime Mysteries",
    subtitle: "Podcast • Spotify",
    type: "podcast",
    image_url: null,
  },
  {
    id: "10",
    title: "Massive Attack",
    subtitle: "Artist",
    type: "artist",
    image_url: null,
    is_circular: true,
  },
  {
    id: "11",
    title: "New Episodes",
    subtitle: "Updates 5 Aug 2004",
    type: "podcast",
    image_url: null,
  },
  {
    id: "12",
    title: "The Smiths",
    subtitle: "Album • The Smiths",
    type: "album",
    image_url: null,
  },
];

function ItemPlaceholder({ item, size }: { item: LibraryItem; size: number }) {
  const r = item.is_circular ? size / 2 : 8;
  if (item.id === "1")
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: r,
          backgroundColor: "#4a90d9",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="heart" size={size * 0.4} color="#fff" />
      </View>
    );
  if (item.id === "2")
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: r,
          backgroundColor: "#1DB954",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="bookmark" size={size * 0.4} color="#fff" />
      </View>
    );
  if (item.id === "11")
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: r,
          backgroundColor: "#6A1B9A",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="notifications" size={size * 0.4} color="#fff" />
      </View>
    );
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        backgroundColor: "#2a2a2a",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons
        name={
          item.type === "artist"
            ? "person"
            : item.type === "podcast"
              ? "mic"
              : "musical-notes"
        }
        size={size * 0.35}
        color="#535353"
      />
    </View>
  );
}

function LibraryItemCard({
  item,
  viewMode,
}: {
  item: LibraryItem;
  viewMode: "grid" | "list";
}) {
  const isCircle = item.is_circular;
  if (viewMode === "list") {
    const s = 64;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          marginBottom: 14,
          width: "100%",
        }}
      >
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={{ width: s, height: s, borderRadius: isCircle ? s / 2 : 6 }}
            resizeMode="cover"
          />
        ) : (
          <ItemPlaceholder item={item} size={s} />
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 15,
              fontWeight: "600",
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={{
              color: "#a7a7a7",
              fontFamily: "CircularStd",
              fontSize: 13,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {item.subtitle}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
  const s = ITEM_W;
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={{ width: s, marginBottom: 20 }}
    >
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={{ width: s, height: s, borderRadius: isCircle ? s / 2 : 8 }}
          resizeMode="cover"
        />
      ) : (
        <ItemPlaceholder item={item} size={s} />
      )}
      <Text
        style={{
          color: "#ffffff",
          fontFamily: "CircularStd",
          fontSize: 12,
          fontWeight: "600",
          marginTop: 8,
        }}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      <Text
        style={{
          color: "#a7a7a7",
          fontFamily: "CircularStd",
          fontSize: 11,
          marginTop: 2,
        }}
        numberOfLines={1}
      >
        {item.subtitle}
      </Text>
    </TouchableOpacity>
  );
}

function FilterChip({
  label,
  onPress,
  active = false,
  isClose = false,
}: {
  label?: string;
  onPress: () => void;
  active?: boolean;
  isClose?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 8,
        speed: 20,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        style={
          isClose
            ? {
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#2a2a2a",
                alignItems: "center",
                justifyContent: "center",
              }
            : {
                paddingHorizontal: active ? 16 : 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: active ? "#1DB954" : "#2a2a2a",
              }
        }
      >
        {isClose ? (
          <Ionicons name="close" size={16} color="#ffffff" />
        ) : (
          <Text
            style={{
              color: active ? "#000000" : "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function LibraryScreen() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<LibraryItemType | "all">(
    "all",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const fadeAnim = useRef(new Animated.Value(1)).current;

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

  const selectFilter = (value: LibraryItemType | "all") => {
    LayoutAnimation.configureNext({
      duration: 260,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "spring", springDamping: 0.85 },
      delete: { type: "easeInEaseOut", property: "opacity" },
    });
    setActiveFilter(value);
  };

  const toggleViewMode = () => {
    // Snap to 0, switch layout immediately, then fade in
    fadeAnim.setValue(0);
    LayoutAnimation.configureNext({
      duration: 220,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "easeInEaseOut", property: "opacity" },
      delete: { type: "easeInEaseOut", property: "opacity" },
    });
    setViewMode((v) => (v === "grid" ? "list" : "grid"));
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const filtered = useMemo(
    () =>
      activeFilter === "all"
        ? MOCK_ITEMS
        : MOCK_ITEMS.filter((i) => i.type === activeFilter),
    [activeFilter],
  );

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
        <TabScreenHeader
          title="Your Library"
          onAvatarPress={() => setOpen(true)}
          rightIcon="search"
          onRightPress={() => router.push("/(tabs)/search-input" as any)}
          rightIcon2="add"
          onRightPress2={() => {}}
          paddingBottom={8}
        />

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 8,
            paddingBottom: 12,
            paddingTop: 4,
            alignItems: "center",
          }}
          style={{ flexGrow: 0, height: 52 }}
        >
          {activeFilter !== "all" ? (
            <>
              <FilterChip isClose onPress={() => selectFilter("all")} />
              <FilterChip
                label={FILTERS.find((f) => f.value === activeFilter)?.label}
                active
                onPress={() => {}}
              />
            </>
          ) : (
            FILTERS.map((f) => (
              <FilterChip
                key={f.value}
                label={f.label}
                onPress={() => selectFilter(f.value)}
              />
            ))
          )}
        </ScrollView>

        {/* List */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            key={viewMode}
            data={filtered}
            keyExtractor={(item) => item.id}
            numColumns={viewMode === "grid" ? 3 : 1}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 140,
            }}
            columnWrapperStyle={
              viewMode === "grid"
                ? { justifyContent: "space-between", marginBottom: 4 }
                : undefined
            }
            renderItem={({ item }) => (
              <LibraryItemCard item={item} viewMode={viewMode} />
            )}
            ListHeaderComponent={
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Ionicons name="swap-vertical" size={18} color="#ffffff" />
                  <Text
                    style={{
                      color: "#ffffff",
                      fontFamily: "CircularStd",
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    Recents
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleViewMode} activeOpacity={0.7}>
                  <Ionicons
                    name={viewMode === "grid" ? "list" : "grid-outline"}
                    size={22}
                    color="#ffffff"
                  />
                </TouchableOpacity>
              </View>
            }
          />
        </Animated.View>
      </SafeAreaView>
    </Drawer>
  );
}
