import { LikedSong } from "@/hooks/useLikedSongsData";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  LayoutChangeEvent,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LikedSongsMoodChips } from "./LikedSongsMoodChips";

type Props = {
  songs: LikedSong[];
  onBack: () => void;
  onShuffle: () => void;
  headerAnim: Animated.Value;
  controlsAnim: Animated.Value;
  paddingTop: number;
  /** Absolute Y of the controls row in scroll-content space */
  onControlsRowLayout: (y: number) => void;
  /** Called when Sort button is tapped */
  onSortPress: () => void;
  /** Search query value */
  searchQuery: string;
  /** Called when search text changes */
  onSearchChange: (q: string) => void;
};

export function LikedSongsHeader({
  songs,
  onBack,
  onShuffle,
  headerAnim,
  controlsAnim,
  paddingTop,
  onControlsRowLayout,
  onSortPress,
  searchQuery,
  onSearchChange,
}: Props) {
  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });
  const controlsTranslateY = controlsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  const firstThumb = songs[0]?.image_url ?? null;
  const topSectionHeightRef = useRef(0);
  const inputRef = useRef<TextInput>(null);

  // Search active state
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Cancel button slides in from right
  const cancelTranslateX = useRef(new Animated.Value(80)).current;
  const cancelOpacity = useRef(new Animated.Value(0)).current;
  // Sort button fades out when search active
  const sortOpacity = useRef(new Animated.Value(1)).current;

  const activateSearch = () => {
    setIsSearchActive(true);
    Animated.parallel([
      Animated.timing(cancelTranslateX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(cancelOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sortOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const deactivateSearch = () => {
    Keyboard.dismiss();
    onSearchChange("");
    Animated.parallel([
      Animated.timing(cancelTranslateX, {
        toValue: 80,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cancelOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(sortOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setIsSearchActive(false));
  };

  return (
    <View>
      {/* ── Top section: back arrow + search bar ── */}
      <LinearGradient
        colors={["#1a3a6b", "#1a3a6b"]}
        onLayout={(e) => {
          topSectionHeightRef.current = e.nativeEvent.layout.height;
        }}
        style={{
          paddingTop: paddingTop + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{ alignSelf: "flex-start", padding: 4, marginBottom: 16 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {/* Search input */}
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 8,
              paddingHorizontal: 12,
              height: 44,
              gap: 8,
            }}
          >
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.7)" />
            <TextInput
              ref={inputRef}
              value={searchQuery}
              onChangeText={onSearchChange}
              onFocus={activateSearch}
              placeholder="Find in Liked Songs"
              placeholderTextColor="rgba(255,255,255,0.55)"
              selectionColor="#1DB954"
              returnKeyType="search"
              style={{
                flex: 1,
                color: "#fff",
                fontSize: 15,
                fontFamily: "CircularStd",
                paddingVertical: 0,
                height: 44,
              }}
            />
            {/* Clear button — only when there's text */}
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => onSearchChange("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Sort button — fades out when search active */}
          {!isSearchActive && (
            <Animated.View style={{ opacity: sortOpacity }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onSortPress}
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 15,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                  }}
                >
                  Sort
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Cancel button — slides in from right when search active */}
          <Animated.View
            style={{
              opacity: cancelOpacity,
              transform: [{ translateX: cancelTranslateX }],
              position: isSearchActive ? "relative" : "absolute",
              right: isSearchActive ? undefined : -100,
            }}
          >
            <TouchableOpacity
              onPress={deactivateSearch}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>

      {/* ── Main gradient: title, count, controls ── */}
      <LinearGradient
        colors={["#1a3a6b", "#0d1f3c", "#121212"]}
        locations={[0, 0.65, 1]}
        style={{ paddingTop: 24, paddingBottom: 20, paddingHorizontal: 16 }}
      >
        {/* Title + count */}
        <Animated.View
          style={{
            opacity: headerAnim,
            transform: [{ translateY: headerTranslateY }],
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 28,
              fontFamily: "CircularStd",
              fontWeight: "600",
              marginBottom: 6,
            }}
          >
            Liked Songs
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 14,
              fontFamily: "CircularStd",
            }}
          >
            {songs.length} {songs.length === 1 ? "song" : "songs"}
          </Text>
        </Animated.View>

        {/* Controls row — play button is floating in parent, only shuffle + download here */}
        <Animated.View
          onLayout={(e: LayoutChangeEvent) => {
            // Absolute Y = top section height + this row's Y within the gradient
            const absoluteY =
              topSectionHeightRef.current +
              e.nativeEvent.layout.y +
              e.nativeEvent.layout.height / 2 -
              28; // half of 56px play button height
            onControlsRowLayout(absoluteY);
          }}
          style={{
            opacity: controlsAnim,
            transform: [{ translateY: controlsTranslateY }],
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 20,
            paddingRight: 72, // reserve space for floating play button
          }}
        >
          {/* Left: thumbnail + download */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            {firstThumb ? (
              <Image
                source={{ uri: firstThumb }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 4,
                  backgroundColor: "#2a2a2a",
                }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 4,
                  backgroundColor: "#4a90d9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="heart" size={24} color="#fff" />
              </View>
            )}
            <TouchableOpacity activeOpacity={0.7}>
              <Ionicons
                name="arrow-down-circle-outline"
                size={30}
                color="#a7a7a7"
              />
            </TouchableOpacity>
          </View>

          {/* Right: shuffle only */}
          <TouchableOpacity onPress={onShuffle} activeOpacity={0.7}>
            <Image
              source={require("@/assets/images/ico-32-shuffle.png")}
              style={{ width: 30, height: 30, tintColor: "#1DB954" }}
              contentFit="contain"
            />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      {/* Mood chips */}
      <Animated.View style={{ opacity: controlsAnim }}>
        <LikedSongsMoodChips />
      </Animated.View>

      {/* Add to playlist row */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 4,
            backgroundColor: "#2a2a2a",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </View>
        <Text
          style={{
            color: "#fff",
            fontSize: 15,
            fontFamily: "CircularStd",
            fontWeight: "600",
          }}
        >
          Add to this playlist
        </Text>
      </TouchableOpacity>
    </View>
  );
}
