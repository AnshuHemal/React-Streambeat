import LoadingDots from "@/components/LoadingDots";
import ProfileDrawerContent from "@/components/ProfileDrawer";
import SortBottomSheet, { SortOption } from "@/components/SortBottomSheet";
import TabScreenHeader from "@/components/TabScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { useLibraryData } from "@/hooks/useLibraryData";
import { LibraryItem, LibraryItemType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const VIEW_MODE_KEY = "library_view_mode";

const FILTERS: { label: string; value: LibraryItemType | "all" }[] = [
  { label: "Playlists", value: "playlist" },
  { label: "Podcasts", value: "podcast" },
  { label: "Albums", value: "album" },
  { label: "Artists", value: "artist" },
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
        ) : item.id === "liked-songs" ? (
          <Image
            source={require("@/assets/images/liked-placeholder.png")}
            style={{ width: s, height: s, borderRadius: 6 }}
            resizeMode="cover"
          />
        ) : item.id === "your-episodes" ? (
          <Image
            source={require("@/assets/images/episodes-placeholder.png")}
            style={{ width: s, height: s, borderRadius: 6 }}
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
      ) : item.id === "liked-songs" ? (
        <Image
          source={require("@/assets/images/liked-placeholder.png")}
          style={{ width: s, height: s, borderRadius: 8 }}
          resizeMode="cover"
        />
      ) : item.id === "your-episodes" ? (
        <Image
          source={require("@/assets/images/episodes-placeholder.png")}
          style={{ width: s, height: s, borderRadius: 8 }}
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
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<LibraryItemType | "all">(
    "all",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("recents");
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load saved view mode preference
  useEffect(() => {
    AsyncStorage.getItem(VIEW_MODE_KEY).then((saved) => {
      if (saved === "list" || saved === "grid") {
        setViewMode(saved);
      }
    });
  }, []);

  // Fetch user's selected artists from Supabase
  const { libraryItems, loading } = useLibraryData(user?.id);

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
    // Configure layout animation for smooth native layout transition
    LayoutAnimation.configureNext({
      duration: 250,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "spring", springDamping: 0.9 },
      delete: { type: "easeInEaseOut", property: "opacity" },
    });
    
    // Quick opacity dip for visual feedback
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.6,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    const newMode = viewMode === "grid" ? "list" : "grid";
    setViewMode(newMode);
    AsyncStorage.setItem(VIEW_MODE_KEY, newMode);
  };

  const filtered = useMemo(
    () =>
      activeFilter === "all"
        ? libraryItems
        : libraryItems.filter((i) => i.type === activeFilter),
    [activeFilter, libraryItems],
  );

  // Dynamically generate available filters based on library data
  const availableFilters = useMemo(() => {
    const typesPresent = libraryItems.reduce<Set<LibraryItemType>>((acc, item) => {
      acc.add(item.type);
      return acc;
    }, new Set());
    return FILTERS.filter((f): f is typeof f & { value: LibraryItemType } => 
      f.value !== "all" && typesPresent.has(f.value)
    );
  }, [libraryItems]);

  const ListHeader = () => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleTogglePress = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 100,
        }),
      ]).start();
      toggleViewMode();
    };

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            onPress={() => setSortSheetVisible(true)}
            activeOpacity={0.7}
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <Image
              source={require("@/assets/images/ico-24-arrow-up-dw.png")}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
            <Text
              style={{
                color: "#ffffff",
                fontFamily: "CircularStd",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {sortOption === "recents" && "Recents"}
              {sortOption === "recently_added" && "Recently added"}
              {sortOption === "alphabetical" && "Alphabetical"}
              {sortOption === "creator" && "Creator"}
            </Text>
          </TouchableOpacity>
        </View>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity onPress={handleTogglePress} activeOpacity={0.7}>
            <Image
              source={
                viewMode === "grid"
                  ? require("@/assets/images/ico-24-paragraph.png")
                  : require("@/assets/images/ico-24-grid.png")
              }
              style={{ width: 26, height: 26 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

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
                label={availableFilters.find((f) => f.value === activeFilter)?.label}
                active
                onPress={() => {}}
              />
            </>
          ) : (
            availableFilters.map((f) => (
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
          {loading ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LoadingDots color="#a7a7a7" size={8} gap={8} />
            </View>
          ) : filtered.length === 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 40,
              }}
            >
              <Text
                style={{
                  color: "#a7a7a7",
                  fontFamily: "CircularStd",
                  fontSize: 16,
                  textAlign: "center",
                }}
              >
                No items found
              </Text>
            </View>
          ) : (
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
                  ? { gap: 12, marginBottom: 4 }
                  : undefined
              }
              renderItem={({ item }) => (
                <LibraryItemCard item={item} viewMode={viewMode} />
              )}
              ListHeaderComponent={<ListHeader />}
            />
          )}
        </Animated.View>

        <SortBottomSheet
          visible={sortSheetVisible}
          selected={sortOption}
          onSelect={setSortOption}
          onClose={() => setSortSheetVisible(false)}
        />
      </SafeAreaView>
    </Drawer>
  );
}
