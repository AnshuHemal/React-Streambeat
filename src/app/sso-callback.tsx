import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function SSOCallbackScreen() {
  const { isLoaded, session } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#121212]">
        <ActivityIndicator color="#1DB954" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)/index" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
