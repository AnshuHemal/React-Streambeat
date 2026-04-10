import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Avatar colors matching ProfileDrawer
const AVATAR_COLORS = [
  "#E91E63",
  "#9C27B0",
  "#3F51B5",
  "#2196F3",
  "#009688",
  "#FF5722",
  "#795548",
  "#607D8B",
];

// Color palette
const COLORS = {
  background: "#121212",
  textPrimary: "#ffffff",
  textSecondary: "#b3b3b3",
  circleSecondary: "#4a4a4a", // The gray color for second circle
  buttonBackground: "#ffffff",
  buttonText: "#000000",
};

export default function CreateBlendScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();

  // Get user's display name and initial
  const displayName =
    profile?.display_name ??
    user?.user_metadata?.display_name ??
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "User";

  const userInitial = displayName.charAt(0).toUpperCase();

  // Generate consistent avatar color matching ProfileDrawer
  const userCircleColor = useMemo(
    () => AVATAR_COLORS[displayName.charCodeAt(0) % AVATAR_COLORS.length],
    [displayName],
  );

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const circle1Anim = useRef(new Animated.Value(0)).current;
  const circle2Anim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animations
    const animations = [
      // Fade in and slide up the container
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      // Scale in the circles
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Staggered circle animations
      Animated.timing(circle1Anim, {
        toValue: 1,
        duration: 600,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(circle2Anim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      // Button fade in
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 400,
        delay: 400,
        useNativeDriver: true,
      }),
    ];

    Animated.parallel(animations).start();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleInvite = () => {
    // TODO: Implement invite functionality
    console.log("Invite friends");
  };

  // Interpolate animations
  const circle1Translate = circle1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  const circle2Translate = circle2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header with status bar padding */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create a Blend</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Circles Container */}
        <View style={styles.circlesContainer}>
          {/* User Circle */}
          <Animated.View
            style={[
              styles.circle,
              styles.userCircle,
              {
                backgroundColor: userCircleColor,
                opacity: scaleAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateX: circle1Translate },
                ],
              },
            ]}
          >
            <Text style={styles.circleText}>{userInitial}</Text>
          </Animated.View>

          {/* Plus Circle */}
          <Animated.View
            style={[
              styles.circle,
              styles.plusCircle,
              {
                opacity: scaleAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateX: circle2Translate },
                ],
              },
            ]}
          >
            <Ionicons name="add" size={48} color={COLORS.textPrimary} />
          </Animated.View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Invite friends to Blend</Text>

        {/* Description */}
        <Text style={styles.description}>
          Invite up to 10 friends to a Blend, a shared playlist that gives you
          social recommendations based on all of your music tastes.
        </Text>

        {/* Note */}
        <Text style={styles.note}>
          Note: People in this Blend will be able to add their friends. We may
          also create other playlists that include social recommendations.
          People in social recommendations playlists will be able to see your
          profile picture and username.{" "}
          <Text style={styles.learnMore}>Learn more</Text> about these playlists
          and information they include.
        </Text>

        {/* Invite Button */}
        <Animated.View
          style={{
            opacity: buttonAnim,
            transform: [
              {
                translateY: buttonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            onPress={handleInvite}
            activeOpacity={0.8}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Invite</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    fontFamily: "CircularStd",
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  circlesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    // Negative margin for overlapping effect
    marginHorizontal: -10,
    // Elevation/shadow
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  userCircle: {
    zIndex: 2,
  },
  plusCircle: {
    backgroundColor: COLORS.circleSecondary,
    zIndex: 1,
  },
  circleText: {
    fontSize: 56,
    fontWeight: "600",
    color: COLORS.textPrimary,
    fontFamily: "CircularStd",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: COLORS.textPrimary,
    fontFamily: "CircularStd",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "CircularStd",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  note: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: "CircularStd",
    textAlign: "center",
    lineHeight: 18,
    opacity: 0.8,
    marginBottom: 32,
  },
  learnMore: {
    color: COLORS.textPrimary,
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: COLORS.buttonBackground,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.buttonText,
    fontFamily: "CircularStd",
  },
});
