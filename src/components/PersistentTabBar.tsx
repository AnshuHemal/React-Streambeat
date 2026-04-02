import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Image, Platform, Text, TouchableOpacity, View } from "react-native";
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
];

export default function PersistentTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Show only on known tab routes
  const shouldShow = TAB_ROUTES.some((r) =>
    r === "/" ? pathname === "/" || pathname === "" : pathname.startsWith(r),
  );
  if (!shouldShow) return null;

  const bottomPad = insets.bottom + (Platform.OS === "android" ? 8 : 4);

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
          height: 100 + insets.bottom,
        }}
        pointerEvents="none"
      />
      <View
        style={{
          flexDirection: "row",
          paddingBottom: bottomPad,
          paddingTop: 10,
          paddingHorizontal: 8,
        }}
      >
        {TABS.map((tab) => {
          const isFocused =
            tab.route === "/"
              ? pathname === "/" || pathname === ""
              : pathname.startsWith(tab.route);

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => router.push(tab.route as any)}
              activeOpacity={0.7}
              style={{ flex: 1, alignItems: "center", gap: 4 }}
            >
              <Image
                source={isFocused ? tab.active : tab.inactive}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
              <Text
                style={{
                  color: isFocused ? "#ffffff" : "#777777",
                  fontSize: 10,
                  fontFamily: "CircularStd",
                  fontWeight: isFocused ? "600" : "400",
                }}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
