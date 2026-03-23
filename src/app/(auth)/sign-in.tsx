import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useSocialAuth from "@/hooks/useSocialAuth";
import usePhoneAuth from "@/hooks/usePhoneAuth";
import { useState } from "react";

export default function SignInScreen() {
  const router = useRouter();
  const { handleSocialAuth, loadingStrategy } = useSocialAuth();
  const {
    handleSendCode,
    handleVerifyCode,
    loading: phoneLoading,
    pendingVerification,
    setPendingVerification,
  } = usePhoneAuth();

  const [isPhoneAuthVisible, setIsPhoneAuthVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const onSendCode = async () => {
    if (phoneNumber.length < 10) return;
    await handleSendCode(phoneNumber);
  };

  const onVerifyCode = async () => {
    if (verificationCode.length < 6) return;
    await handleVerifyCode(verificationCode);
  };

  const isGoogleLoading = loadingStrategy === "oauth_google";
  const isFacebookLoading = loadingStrategy === "oauth_facebook";
  const isAppleLoading = loadingStrategy === "oauth_apple";
  const isAnyLoading =
    isGoogleLoading || isFacebookLoading || isAppleLoading || phoneLoading;

  if (isPhoneAuthVisible) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 px-6">
          <TouchableOpacity
            onPress={() => {
              setIsPhoneAuthVisible(false);
              setPendingVerification(false);
            }}
            className="pt-4 mb-10"
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <Text className="text-white text-3xl font-bold mb-8">
            {!pendingVerification
              ? "Enter your phone number"
              : "Check your SMS"}
          </Text>

          {!pendingVerification ? (
            <View>
              <View className="flex-row items-center border-b border-gray-600 pb-2 mb-8">
                <Text className="text-white text-lg mr-2">+1</Text>
                <TextInput
                  autoFocus
                  keyboardType="phone-pad"
                  placeholder="Phone number"
                  placeholderTextColor="#666"
                  className="flex-1 text-white text-lg"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>
              <TouchableOpacity
                onPress={onSendCode}
                disabled={isAnyLoading || phoneNumber.length < 10}
                className={`bg-[#1DB954] rounded-full py-4 items-center ${
                  phoneNumber.length < 10 || isAnyLoading ? "opacity-50" : ""
                }`}
                activeOpacity={0.8}
              >
                {phoneLoading ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <Text className="text-black font-bold text-base">Next</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View className="flex-row items-center border-b border-gray-600 pb-2 mb-8">
                <TextInput
                  autoFocus
                  keyboardType="number-pad"
                  placeholder="6-digit code"
                  placeholderTextColor="#666"
                  className="flex-1 text-white text-lg text-center tracking-[4px]"
                  maxLength={6}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                />
              </View>
              <TouchableOpacity
                onPress={onVerifyCode}
                disabled={isAnyLoading || verificationCode.length < 6}
                className={`bg-[#1DB954] rounded-full py-4 items-center ${
                  verificationCode.length < 6 || isAnyLoading
                    ? "opacity-50"
                    : ""
                }`}
                activeOpacity={0.8}
              >
                {phoneLoading ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <Text className="text-black font-bold text-base">Verify</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPendingVerification(false)}
                className="mt-6 items-center"
              >
                <Text className="text-white font-medium">
                  Edit phone number
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text className="text-gray-400 text-xs mt-6 text-center">
            You'll receive an SMS to verify your number. Standard rates apply.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1 px-6"
      >
        <View className="flex-1 justify-end pb-12">
          <View className="items-center mb-10">
            <Image
              source={require("@/assets/images/logo-white.png")}
              className="w-16 h-16 mb-8"
              resizeMode="contain"
            />

            <Text className="text-white text-3xl font-bold text-center leading-tight font-CircularStd">
              Millions of songs.{"\n"}Free on Streambeat.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsPhoneAuthVisible(true)}
            className="bg-[#1DB954] rounded-full py-4 items-center mb-4"
            activeOpacity={0.8}
          >
            <Text className="text-black font-bold text-lg font-CircularStd">Sign up free</Text>
          </TouchableOpacity>
          <View className="gap-y-3">
            <TouchableOpacity
              onPress={() => handleSocialAuth("oauth_google")}
              disabled={isAnyLoading}
              className="flex-row items-center border border-gray-700 rounded-full py-4 px-5"
              activeOpacity={0.7}
            >
              <View className="w-8 items-center">
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <FontAwesome name="google" size={22} color="#EA4335" />
                )}
              </View>
              <Text className="flex-1 text-center text-white text-lg font-medium font-CircularStd">
                Continue with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSocialAuth("oauth_facebook")}
              disabled={isAnyLoading}
              className="flex-row items-center border border-gray-700 rounded-full py-4 px-5"
              activeOpacity={0.7}
            >
              <View className="w-8 items-center">
                {isFacebookLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <FontAwesome name="facebook" size={22} color="#1877F2" />
                )}
              </View>
              <Text className="flex-1 text-center text-white text-lg font-medium font-CircularStd">
                Continue with Facebook
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSocialAuth("oauth_apple")}
              disabled={isAnyLoading}
              className="flex-row items-center border border-gray-700 rounded-full py-4 px-5"
              activeOpacity={0.7}
            >
              <View className="w-8 items-center text-center">
                {isAppleLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <FontAwesome name="apple" size={22} color="#fff" />
                )}
              </View>
              <Text className="flex-1 text-center text-white text-lg font-medium font-CircularStd">
                Continue with Apple
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => setIsPhoneAuthVisible(true)}
            className="mt-6 items-center"
          >
            <Text className="text-white font-medium font-CircularStd text-lg">Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
