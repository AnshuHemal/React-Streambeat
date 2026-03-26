import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={["top"]}>
      <View className="flex-1 items-center justify-center">
        <Text className="text-white text-xl font-CircularStd ">Search</Text>
      </View>
    </SafeAreaView>
  );
}
