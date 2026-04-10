import CreateMenuPopup from "@/components/CreateMenuPopup";
import { useCreateButtonSetting } from "@/hooks/useCreateButtonSetting";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Image, Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Only show the tab bar on these routes (and their sub-paths)
const TAB_ROUTES = [
  "/",
  "/search",
  "/library",
  "/premium",
  "/settings",
  "/album",
  "/artist",
  "/liked-songs",
];

type TabItem = {
  name: string;
  route: string;
  label: string;
  active: any;
  inactive: any;
};

const TABS: TabItem[] = [
  {
    name: "index",
    route: "/",
    label: "Home",
    active: require("@/assets/images/ico-32-home-fill.png"),
    inactive: require("@/assets/images/ico-32-home.png"),
  },
  {
    name: "search",
    route: "/search",
    label: "Search",
    active: require("@/assets/images/ico-32-search-fill.png"),
    inactive: require("@/assets/images/ico-32-search.png"),
  },
  {
    name: "library",
    route: "/library",
    label: "Your Library",
    active: require("@/assets/images/ico-32-library-fill.png"),
    inactive: require("@/assets/images/ico-32-library.png"),
  },
  {
    name: "premium",
    route: "/premium",
    label: "Premium",
    active: require("@/assets/images/ico-32-premium.png"),
    inactive: require("@/assets/images/ico-32-premium.png"),
  },
  {
    name: "create",
    route: "/create",
    label: "Create",
    active: null,
    inactive: null,
  },
];

export default function PersistentTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isEnabled: showCreateButton, isLoaded } = useCreateButtonSetting();

  // State to track which tabs are currently visible (for animation sequence)
  const [visibleTabCount, setVisibleTabCount] = React.useState(4);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);

  // Animation value for the entire tab bar container
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Animation values for Create button icon transformation
  const iconRotation = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  // Handle tab layout changes with slide-down, update, slide-up animation
  useEffect(() => {
    if (!isLoaded || isAnimating) return;

    const targetCount = showCreateButton ? 5 : 4;
    if (visibleTabCount === targetCount) return;

    setIsAnimating(true);

    // Phase 1: Slide down and fade out
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: Update the tab layout while hidden
      setVisibleTabCount(targetCount);

      // Phase 3: Slide up and fade in (with small delay for state update)
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 40,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsAnimating(false);
        });
      }, 50);
    });
  }, [showCreateButton, isLoaded]);

  // Initialize tab count on first load
  useEffect(() => {
    if (isLoaded && !isAnimating) {
      setVisibleTabCount(showCreateButton ? 5 : 4);
    }
  }, [isLoaded]);

  // Handle Create button icon animation with symmetric open/close
  useEffect(() => {
    const springConfig = {
      useNativeDriver: true,
      friction: 9,
      tension: 100,
    };

    if (isCreateSheetOpen) {
      // Open: rotate to X (45deg) with subtle scale pulse
      Animated.parallel([
        Animated.spring(iconRotation, {
          ...springConfig,
          toValue: 1,
        }),
        Animated.sequence([
          Animated.spring(iconScale, {
            ...springConfig,
            toValue: 1.15,
          }),
          Animated.spring(iconScale, {
            ...springConfig,
            toValue: 1,
          }),
        ]),
      ]).start();
    } else {
      // Close: rotate back to Plus with matching animation
      Animated.parallel([
        Animated.spring(iconRotation, {
          ...springConfig,
          toValue: 0,
        }),
        Animated.spring(iconScale, {
          ...springConfig,
          toValue: 1,
        }),
      ]).start();
    }
  }, [isCreateSheetOpen]);

  // Close create sheet when navigating to a different screen
  useEffect(() => {
    if (isCreateSheetOpen) {
      setIsCreateSheetOpen(false);
    }
  }, [pathname]);

  // Show only on known tab routes
  const shouldShow = TAB_ROUTES.some((r) =>
    r === "/" ? pathname === "/" || pathname === "" : pathname.startsWith(r),
  );
  if (!shouldShow) return null;

  const bottomPad = insets.bottom + (Platform.OS === "android" ? 8 : 4);

  // Get visible tabs based on current count
  const visibleTabs = TABS.slice(0, visibleTabCount);

  const handleTabPress = (tab: TabItem) => {
    if (tab.name === "create") {
      setIsCreateSheetOpen(!isCreateSheetOpen);
    } else {
      // If create menu is open, close it first then navigate
      if (isCreateSheetOpen) {
        setIsCreateSheetOpen(false);
      }
      router.push(tab.route as any);
    }
  };

  const handleCreateSheetClose = () => {
    setIsCreateSheetOpen(false);
  };

  // Interpolate values for icon animation
  const rotateInterpolate = iconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const backgroundColor = "transparent";

  return (
    <View
      style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={[
          "rgba(18,18,18,0)",
          "rgba(18,18,18,0.85)",
          "rgba(18,18,18,0.98)",
        ]}
        locations={[0, 0.6, 1]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 140 + insets.bottom,
        }}
        pointerEvents="none"
      />
      <Animated.View
        style={{
          flexDirection: "row",
          paddingBottom: bottomPad,
          paddingTop: 10,
          paddingHorizontal: 8,
          transform: [{ translateY }],
          opacity,
        }}
      >
        {visibleTabs.map((tab) => {
          const isFocused =
            tab.route === "/"
              ? pathname === "/" || pathname === ""
              : pathname.startsWith(tab.route);
          const isCreateTab = tab.name === "create";
          const showAsActive = isCreateTab ? isCreateSheetOpen : isFocused;

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => handleTabPress(tab)}
              activeOpacity={0.7}
              style={{ flex: 1, alignItems: "center", gap: 4 }}
            >
              {isCreateTab ? (
                <View style={{ width: 32, height: 32 }}>
                  <Animated.View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: 16,
                      backgroundColor,
                    }}
                  />
                  <Animated.View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      transform: [
                        { rotate: rotateInterpolate },
                        { scale: iconScale },
                      ],
                    }}
                  >
                    <Ionicons
                      name="add"
                      size={32}
                      color="#ffffff"
                    />
                  </Animated.View>
                </View>
              ) : (
                <Image
                  source={isFocused ? tab.active : tab.inactive}
                  style={{
                    width: 32,
                    height: 32,
                  }}
                  resizeMode="contain"
                />
              )}
              <Text
                style={{
                  color: showAsActive ? "#ffffff" : "#777777",
                  fontSize: 10,
                  fontFamily: "CircularStd",
                  fontWeight: showAsActive ? "600" : "400",
                }}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
      <CreateMenuPopup
        visible={isCreateSheetOpen}
        onClose={handleCreateSheetClose}
      />
    </View>
  );
}
