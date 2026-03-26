import useSocialAuth from "@/hooks/useSocialAuth";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import {
    ActivityIndicator,
    Image,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function SignInScreen() {
  const router = useRouter();
  const { signup } = useLocalSearchParams<{ signup?: string }>();
  const { handleSocialAuth, loadingStrategy } = useSocialAuth();

  const isGoogleLoading = loadingStrategy === "google";
  const isAppleLoading = loadingStrategy === "apple";
  const isAnyLoading = isGoogleLoading || isAppleLoading;

  useEffect(() => {
    if (signup === "success") {
      toast.success("Account created successfully", {
        description: "Please verify your email, then log in to continue.",
        duration: 5000,
      });
    }
  }, [signup]);

  return (
    <View className="flex-1 bg-[#121212]">
      <View className="w-full">
        <Image
          source={require("@/assets/images/login-bg.png")}
          className="w-full h-[60vh]"
          resizeMode="cover"
        />
      </View>

      <SafeAreaView className="flex-1" edges={["bottom"]}>
        <View className="flex-1 justify-end items-center px-6 pb-5">
          <Image
            source={require("@/assets/images/logo-white.png")}
            className="w-16 h-16 mb-4"
            resizeMode="contain"
          />

          <View className="items-center mb-10 px-4">
            <Text className="text-white text-[32px] font-bold text-center leading-[42px]">
              Millions of songs.{"\n"}Free on Streambeat.
            </Text>
          </View>

          <View className="w-full gap-y-3 mb-4">
            <TouchableOpacity
              onPress={() => router.push("/(auth)/signup")}
              disabled={isAnyLoading}
              className="flex-row items-center justify-center bg-[#1DB954] rounded-full py-4 px-5"
              activeOpacity={0.8}
            >
              <Text className="text-black text-lg font-bold">Sign up free</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/phone")}
              disabled={isAnyLoading}
              className="flex-row items-center border border-[#777777] rounded-full py-4 px-5"
              activeOpacity={0.7}
            >
              <View className="w-8 items-center">
                <Image
                  source={require("@/assets/images/logo-phone.png")}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
              </View>
              <Text className="flex-1 text-center text-white text-lg font-bold">
                Continue with phone number
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSocialAuth("google")}
              disabled={isAnyLoading}
              className="flex-row items-center border border-[#777777] rounded-full py-4 px-5"
              activeOpacity={0.7}
            >
              <View className="w-8 items-center">
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Image
                    source={require("@/assets/images/logo-google.png")}
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text className="flex-1 text-center text-white text-lg font-bold">
                Continue with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSocialAuth("apple")}
              disabled={isAnyLoading}
              className="flex-row items-center border border-[#777777] rounded-full py-4 px-5"
              activeOpacity={0.7}
            >
              <View className="w-8 items-center">
                {isAppleLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Image
                    source={require("@/assets/images/logo-apple.png")}
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text className="flex-1 text-center text-white text-lg font-bold">
                Continue with Apple
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              className="mt-2 items-center"
            >
              <Text className="text-white font-bold text-lg">Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
