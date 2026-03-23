import useSocialAuth from "@/hooks/useSocialAuth";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

export default function SignInScreen() {
  const router = useRouter();
  const { handleSocialAuth, loadingStrategy } = useSocialAuth();

  const isGoogleLoading = loadingStrategy === "oauth_google";
  const isFacebookLoading = loadingStrategy === "oauth_facebook";
  const isAppleLoading = loadingStrategy === "oauth_apple";
  const isAnyLoading = isGoogleLoading || isFacebookLoading || isAppleLoading;

  return (
    <View className="flex-1 bg-black">
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
            <Text className="text-white text-[32px] font-bold text-center leading-[42px] font-CircularStd">
              Millions of songs.{"\n"}Free on Streambeat.
            </Text>
          </View>

          <View className="w-full gap-y-3 mb-4">
            <TouchableOpacity
              onPress={() => router.push("/(auth)/phone-auth")}
              disabled={isAnyLoading}
              className="flex-row items-center border border-[#777777] rounded-full py-4 px-5"
              activeOpacity={0.7}
            >
              <View className="w-8 items-center">
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Image
                    source={require("@/assets/images/logo-phone.png")}
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text className="flex-1 text-center text-white text-lg font-bold font-CircularStd">
                Continue with phone number
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSocialAuth("oauth_google")}
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
              <Text className="flex-1 text-center text-white text-lg font-bold font-CircularStd">
                Continue with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSocialAuth("oauth_facebook")}
              disabled={isAnyLoading}
              className="flex-row items-center border border-[#777777] rounded-full py-4 px-5 w-full"
              activeOpacity={0.7}
            >
              <View className="w-8 items-center">
                {isFacebookLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Image
                    source={require("@/assets/images/logo-facebook.png")}
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text className="flex-1 text-center text-white text-lg font-bold font-CircularStd">
                Continue with Facebook
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSocialAuth("oauth_apple")}
              disabled={isAnyLoading}
              className="flex-row items-center border border-[#777777] rounded-full py-4 px-5"
              activeOpacity={0.7}
            >
              <View className="w-8 items-center text-center">
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
              <Text className="flex-1 text-center text-white text-lg font-bold font-CircularStd">
                Continue with Apple
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/phone-auth")}
              className="mt-2 items-center"
            >
              <Text className="text-white font-bold font-CircularStd text-lg">
                Log in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
