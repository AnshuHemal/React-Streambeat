import PlayingIndicator from "@/components/PlayingIndicator";
import { LikedSong } from "@/hooks/useLikedSongsData";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

type Props = {
  song: LikedSong;
  isCurrentSong: boolean;
  isPlaying: boolean;
  onPress: () => void;
  onOptionsPress: () => void;
  index: number;
  visible: boolean;
};

export const LikedSongRow = React.memo(
  function LikedSongRow({
    song,
    isCurrentSong,
    isPlaying,
    onPress,
    onOptionsPress,
    index,
    visible,
  }: Props) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(14)).current;

    useEffect(() => {
      if (!visible) return;
      const delay = Math.min(index * 30, 360);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 260,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    }, [visible]);

    return (
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          {song.image_url ? (
            <Image
              source={{ uri: song.image_url }}
              style={{
                width: 46,
                height: 46,
                borderRadius: 4,
                backgroundColor: "#2a2a2a",
              }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 4,
                backgroundColor: "#2a2a2a",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="musical-note" size={22} color="#535353" />
            </View>
          )}

          <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {isCurrentSong && (
                <PlayingIndicator
                  isPlaying={isPlaying}
                  style={{ marginRight: 6 }}
                />
              )}
              <Text
                numberOfLines={1}
                style={{
                  color: isCurrentSong ? "#1DB954" : "#fff",
                  fontSize: 15,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                {song.title}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={{
                color: "#a7a7a7",
                fontSize: 13,
                fontFamily: "CircularStd",
                marginTop: 2,
              }}
            >
              {song.artist_name}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onOptionsPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ padding: 4 }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#a7a7a7" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  },
  (prev, next) =>
    prev.isCurrentSong === next.isCurrentSong &&
    prev.isPlaying === next.isPlaying &&
    prev.visible === next.visible &&
    prev.song.id === next.song.id,
);
