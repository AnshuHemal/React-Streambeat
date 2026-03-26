import { useAuth } from "@/context/AuthContext";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Image,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabConfig = {
  label: string;
  active: any;
  inactive: any;
};

const TABS: Record<string, TabConfig> = {
  index: {
    label: "Home",
    active: require("@/assets/images/ico-32-home-fill.png"),
    inactive: require("@/assets/images/ico-32-home.png"),
  },
  search: {
    label: "Search",
    active: require("@/assets/images/ico-32-search-fill.png"),
    inactive: require("@/assets/images/ico-32-search.png"),
  },
  library: {
    label: "Your Library",
    active: require("@/assets/images/ico-32-library-fill.png"),
    inactive: require("@/assets/images/ico-32-library.png"),
  },
  premium: {
    label: "Premium",
    active: require("@/assets/images/ico-32-premium.png"),
    inactive: require("@/assets/images/ico-32-premium.png"),
  },
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom + (Platform.OS === "android" ? 8 : 4);

  return (
    <View
      style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
      pointerEvents="box-none"
    >
      {/* True smooth gradient — no banding */}
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

      {/* Tab row */}
      <View
        style={{
          flexDirection: "row",
          paddingBottom: bottomPad,
          paddingTop: 10,
          paddingHorizontal: 8,
          backgroundColor: "transparent",
        }}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TABS[route.name];

          // Don't render a tab button for hidden routes (e.g. settings)
          if (!config) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={{ flex: 1, alignItems: "center", gap: 4 }}
            >
              <Image
                source={isFocused ? config.active : config.inactive}
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
                {config?.label ?? route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { isLoaded, session } = useAuth();

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#121212",
        }}
      >
        <ActivityIndicator color="#1DB954" />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "#121212" },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="premium" />
      <Tabs.Screen
        name="settings"
        options={{ tabBarButton: () => null, animation: "fade" }}
      />
    </Tabs>
  );
}
