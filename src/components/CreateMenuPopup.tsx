import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type CreateOption = {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function CreateMenuPopup({ visible, onClose }: Props) {
  const router = useRouter();
  const [internalVisible, setInternalVisible] = React.useState(visible);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(10)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Staggered item animations
  const itemAnimations = useRef(
    [0, 1, 2].map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(-10),
    }))
  ).current;

  // Handle visibility changes with mount/unmount and animations
  useEffect(() => {
    if (visible) {
      // Mount first
      setInternalVisible(true);
      // Then animate in (use requestAnimationFrame for smooth start)
      requestAnimationFrame(() => {
        // Reset values
        scaleAnim.setValue(0.9);
        opacityAnim.setValue(0);
        translateYAnim.setValue(10);
        backdropOpacity.setValue(0);
        itemAnimations.forEach((anim) => {
          anim.opacity.setValue(0);
          anim.translateX.setValue(-10);
        });

        // Animate popup and backdrop in
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Stagger items
          itemAnimations.forEach((anim, index) => {
            Animated.parallel([
              Animated.timing(anim.opacity, {
                toValue: 1,
                duration: 200,
                delay: index * 60,
                useNativeDriver: true,
              }),
              Animated.spring(anim.translateX, {
                toValue: 0,
                friction: 8,
                tension: 50,
                delay: index * 60,
                useNativeDriver: true,
              }),
            ]).start();
          });
        });
      });
    } else {
      // Animate out then unmount
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 10,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setInternalVisible(false);
      });
    }
  }, [visible]);

  const handleBackdropPress = () => {
    onClose();
  };

  const handlePlaylistPress = () => {
    onClose();
    setTimeout(() => {
      router.push("/create-playlist" as any);
    }, 150);
  };

  const handleCollaborativePress = () => {
    onClose();
  };

  const handleBlendPress = () => {
    onClose();
  };

  const options: CreateOption[] = [
    {
      id: "playlist",
      icon: (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "#2a2a2a",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="musical-note" size={22} color="#ffffff" />
        </View>
      ),
      title: "Playlist",
      subtitle: "Create a playlist with songs or episodes",
      onPress: handlePlaylistPress,
    },
    {
      id: "collaborative",
      icon: (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "#2a2a2a",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="people" size={22} color="#ffffff" />
        </View>
      ),
      title: "Collaborative playlist",
      subtitle: "Create a playlist together with friends",
      onPress: handleCollaborativePress,
    },
    {
      id: "blend",
      icon: (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "#2a2a2a",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 13,
                height: 13,
                borderRadius: 6.5,
                backgroundColor: "#ffffff",
              }}
            />
            <View
              style={{
                width: 13,
                height: 13,
                borderRadius: 6.5,
                backgroundColor: "rgba(255,255,255,0.5)",
                marginLeft: -5,
              }}
            />
          </View>
        </View>
      ),
      title: "Blend",
      subtitle: "Combine your friends' tastes into a playlist",
      onPress: handleBlendPress,
    },
  ];

  if (!internalVisible) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: -1000,
        left: -500,
        right: -500,
        bottom: -100,
        zIndex: 9999,
      }}
      pointerEvents="box-none"
    >
      {/* Backdrop - covers screen but NOT tab bar (ends where popup begins) */}
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 500,
            right: 500,
            bottom: 20,
            backgroundColor: "rgba(0,0,0,0.65)",
            opacity: backdropOpacity,
          }}
          pointerEvents="auto"
        />
      </TouchableWithoutFeedback>

      {/* Popup - positioned well above tab bar */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 220,
          left: 512,
          right: 512,
          backgroundColor: "#1e1e1e",
          borderRadius: 16,
          paddingHorizontal: 18,
          paddingVertical: 20,
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 12,
        }}
        pointerEvents="auto"
      >
        {options.map((option, index) => {
          const anim = itemAnimations[index];
          return (
            <TouchableOpacity
              key={option.id}
              onPress={option.onPress}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                marginBottom: index < options.length - 1 ? 8 : 0,
              }}
            >
              <Animated.View
                style={{
                  opacity: anim.opacity,
                  transform: [{ translateX: anim.translateX }],
                }}
              >
                {option.icon}
              </Animated.View>
              <Animated.View
                style={{
                  marginLeft: 16,
                  flex: 1,
                  opacity: anim.opacity,
                  transform: [{ translateX: anim.translateX }],
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    fontWeight: "600",
                    fontFamily: "CircularStd",
                    marginBottom: 3,
                  }}
                >
                  {option.title}
                </Text>
                <Text
                  style={{
                    color: "#a7a7a7",
                    fontSize: 13,
                    fontFamily: "CircularStd",
                    lineHeight: 18,
                  }}
                >
                  {option.subtitle}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </View>
  );
}
