import ProfileDrawerContent from "@/components/ProfileDrawer";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
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

const GREETING_SECTIONS = [
  { id: "1", title: "Recently played" },
  { id: "2", title: "Top mixes" },
  { id: "3", title: "Made for you" },
];

const QUICK_ITEMS = Array.from({ length: 6 }, (_, i) => ({
  id: String(i + 1),
  title: `Playlist ${i + 1}`,
}));

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Music" | "Podcasts"
  >("All");

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (open) {
        setOpen(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [open]);

  const displayName =
    profile?.display_name ??
    user?.user_metadata?.display_name ??
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    user?.phone ??
    "there";

  const avatarLetter = displayName.charAt(0).toUpperCase();
  const avatarColor = useMemo(
    () => AVATAR_COLORS[displayName.charCodeAt(0) % AVATAR_COLORS.length],
    [displayName],
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                flex: 1,
              }}
            >
              <TouchableOpacity
                onPress={() => setOpen(true)}
                activeOpacity={0.8}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: avatarColor,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: "600",
                    fontFamily: "CircularStd",
                  }}
                >
                  {avatarLetter}
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 22,
                  fontWeight: "600",
                  fontFamily: "CircularStd",
                }}
              >
                {getGreeting()}
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
            >
              <TouchableOpacity activeOpacity={0.7}>
                <Ionicons
                  name="notifications-outline"
                  size={26}
                  color="white"
                />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7}>
                <Image
                  source={require("@/assets/images/ico-32-cronology.png")}
                  style={{ width: 32, height: 32, tintColor: "#ffffff" }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter tabs */}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              paddingHorizontal: 20,
              marginBottom: 20,
            }}
          >
            {(["All", "Music", "Podcasts"] as const).map((tab) => {
              const isActive = activeFilter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveFilter(tab)}
                  activeOpacity={0.8}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isActive ? "#1DB954" : "#2a2a2a",
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? "#000000" : "#ffffff",
                      fontFamily: "CircularStd",
                      fontSize: 14,
                      fontWeight: isActive ? "600" : "500",
                    }}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quick access grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: 12,
              gap: 8,
              marginBottom: 32,
            }}
          >
            {QUICK_ITEMS.map((item) => (
              <View key={item.id} style={{ width: "47%" }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#282828",
                    borderRadius: 6,
                    overflow: "hidden",
                    height: 56,
                  }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      backgroundColor: "#535353",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="musical-notes" size={22} color="#1DB954" />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      color: "#ffffff",
                      fontSize: 13,
                      fontFamily: "CircularStd",
                      fontWeight: "600",
                      paddingHorizontal: 12,
                    }}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Sections */}
          {GREETING_SECTIONS.map((section) => (
            <View key={section.id} style={{ marginBottom: 32 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 20,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 20,
                    fontWeight: "600",
                    fontFamily: "CircularStd",
                  }}
                >
                  {section.title}
                </Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text
                    style={{
                      color: "#B3B3B3",
                      fontSize: 13,
                      fontFamily: "CircularStd",
                    }}
                  >
                    Show all
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.7}
                    style={{ width: 144 }}
                  >
                    <View
                      style={{
                        width: 144,
                        height: 144,
                        borderRadius: 6,
                        backgroundColor: "#282828",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Ionicons
                        name="musical-notes"
                        size={40}
                        color="#535353"
                      />
                    </View>
                    <Text
                      style={{
                        color: "#ffffff",
                        fontSize: 13,
                        fontFamily: "CircularStd",
                      }}
                      numberOfLines={2}
                    >
                      {section.title} {i + 1}
                    </Text>
                    <Text
                      style={{
                        color: "#B3B3B3",
                        fontSize: 12,
                        fontFamily: "CircularStd",
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      Playlist • Streambeat
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Drawer>
  );
}
