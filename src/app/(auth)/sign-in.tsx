import useSocialAuth from "@/hooks/useSocialAuth";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    Image,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Toast({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        zIndex: 100,
        opacity,
        transform: [{ translateY }],
        backgroundColor: "#1DB954",
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 18,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      <Ionicons name="checkmark-circle" size={20} color="#000" />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: "#000",
            fontFamily: "CircularStd",
            fontWeight: "700",
            fontSize: 14,
          }}
        >
          Account created successfully
        </Text>
        <Text
          style={{
            color: "#000",
            fontFamily: "CircularStd",
            fontSize: 12,
            marginTop: 2,
            opacity: 0.75,
          }}
        >
          Please verify your email, then log in to continue.
        </Text>
      </View>
    </Animated.View>
  );
}

export default function SignInScreen() {
  const router = useRouter();
  const { signup } = useLocalSearchParams<{ signup?: string }>();
  const { handleSocialAuth, loadingStrategy } = useSocialAuth();

  const isGoogleLoading = loadingStrategy === "google";
  const isAppleLoading = loadingStrategy === "apple";
  const isAnyLoading = isGoogleLoading || isAppleLoading;
  const showToast = signup === "success";

  return (
    <View className="flex-1 bg-[#121212]">
      <Toast visible={showToast} />

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
