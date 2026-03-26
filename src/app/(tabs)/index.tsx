import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const { user, signOut } = useAuth();

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    user?.phone ??
    "there";

  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-[#121212] pb-5" edges={["top", "bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-6">
          <Text className="text-white text-2xl font-CircularStd ">
            {getGreeting()}
          </Text>
          <View className="flex-row items-center gap-x-4">
            <TouchableOpacity activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={26} color="white" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7}>
              <Ionicons name="time-outline" size={26} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={signOut}
              activeOpacity={0.7}
              className="w-9 h-9 rounded-full bg-[#535353] items-center justify-center"
            >
              <Text className="text-white text-sm font-CircularStd ">
                {avatarLetter}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick access grid */}
        <View className="flex-row flex-wrap px-3 gap-y-2 mb-8">
          {QUICK_ITEMS.map((item) => (
            <View key={item.id} className="w-1/2 px-2">
              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-row items-center bg-[#282828] rounded-md overflow-hidden h-14"
              >
                <View className="w-14 h-14 bg-[#535353] items-center justify-center">
                  <Ionicons name="musical-notes" size={22} color="#1DB954" />
                </View>
                <Text
                  className="flex-1 text-white text-sm font-CircularStd  px-3"
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
          <View key={section.id} className="mb-8">
            <View className="flex-row items-center justify-between px-5 mb-4">
              <Text className="text-white text-xl font-CircularStd ">
                {section.title}
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-[#B3B3B3] text-sm ">Show all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <TouchableOpacity key={i} activeOpacity={0.7} className="w-36">
                  <View className="w-36 h-36 rounded-md bg-[#282828] items-center justify-center mb-2">
                    <Ionicons name="musical-notes" size={40} color="#535353" />
                  </View>
                  <Text className="text-white text-sm " numberOfLines={2}>
                    {section.title} {i + 1}
                  </Text>
                  <Text
                    className="text-[#B3B3B3] text-xs  mt-0.5"
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
  );
}
