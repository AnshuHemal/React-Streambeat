import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import { Image, View } from "react-native";

export default function Index() {
  const { isLoaded, session, profile } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#121212]">
        <Image
          source={require("@/assets/images/logo.png")}
          className="w-[140px] h-[140px]"
          resizeMode="contain"
        />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/sign-in" />;

  // Profile loaded and onboarding not done → go to onboarding
  if (profile && !profile.onboarding_complete) {
    return <Redirect href={"/onboarding/music" as any} />;
  }

  return <Redirect href="/(tabs)" />;
}
