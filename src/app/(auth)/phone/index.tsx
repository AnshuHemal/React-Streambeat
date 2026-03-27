import { getCountrySelection } from "@/constants/countryStore";
import usePhoneAuth from "@/hooks/usePhoneAuth";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PhoneAuthScreen() {
  const router = useRouter();

  const {
    handleSendCode,
    handleVerifyCode,
    loading,
    pendingVerification,
    setPendingVerification,
  } = usePhoneAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [country, setCountry] = useState("India");
  const [countryCode, setCountryCode] = useState("+91");

  useFocusEffect(
    useCallback(() => {
      const selection = getCountrySelection();
      if (selection) {
        setCountry(selection.name);
        setCountryCode(selection.code);
      }
    }, []),
  );

  const onSendCode = async () => {
    if (phoneNumber.length < 10) return;
    await handleSendCode(`${countryCode}${phoneNumber}`);
  };

  const onVerifyCode = async () => {
    if (verificationCode.length < 6) return;
    await handleVerifyCode(verificationCode);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6">
          <TouchableOpacity
            onPress={() => {
              if (pendingVerification) {
                setPendingVerification(false);
              } else {
                router.back();
              }
            }}
            className="pt-4 mb-10"
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <Text className="text-white text-3xl font-CircularStd mb-8">
            {!pendingVerification ? "Enter phone number" : "Check your SMS"}
          </Text>

          {!pendingVerification ? (
            <View>
              <View className="bg-[#2a2a2a] rounded-lg overflow-hidden mb-2">
                <TouchableOpacity
                  className="flex-row items-center justify-between px-4 py-4 border-b border-[#3a3a3a]"
                  activeOpacity={0.7}
                  onPress={() => router.push("/(auth)/phone/choose-country")}
                >
                  <Text className="text-white text-lg">{country}</Text>
                  <Ionicons name="chevron-forward" size={20} color="white" />
                </TouchableOpacity>

                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/phone/choose-country")}
                    className="px-5 py-4 border-r border-[#3a3a3a]"
                  >
                    <Text className="text-white text-lg">{countryCode}</Text>
                  </TouchableOpacity>
                  <TextInput
                    autoFocus
                    keyboardType="phone-pad"
                    placeholder="Phone number"
                    placeholderTextColor="#888"
                    className="flex-1 text-white text-lg px-4 py-4"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    selectionColor="white"
                  />
                </View>
              </View>

              <View className="mb-12">
                <Text className="text-white text-[12px] font-normal mb-4">
                  We'll send you a code to confirm your phone number.
                </Text>
                <Text className="text-white text-[12px] font-normal">
                  We may occasionally send you service-based messages.
                </Text>
              </View>

              <View className="items-center">
                <TouchableOpacity
                  onPress={onSendCode}
                  disabled={loading || phoneNumber.length < 10}
                  className={`bg-white rounded-full py-3.5 px-10 min-w-[120px] items-center ${
                    phoneNumber.length < 10 || loading ? "opacity-30" : ""
                  }`}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <Text className="text-black font-CircularStd text-lg">
                      Next
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View className="bg-[#2a2a2a] rounded-lg overflow-hidden mb-8">
                <TextInput
                  autoFocus
                  keyboardType="number-pad"
                  placeholder="6-digit code"
                  placeholderTextColor="#888"
                  className="text-white text-2xl py-6 text-center tracking-[12px]"
                  maxLength={6}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  selectionColor="white"
                />
              </View>

              <View className="items-center">
                <TouchableOpacity
                  onPress={onVerifyCode}
                  disabled={loading || verificationCode.length < 6}
                  className={`bg-white rounded-full py-3.5 px-10 min-w-[120px] items-center ${
                    verificationCode.length < 6 || loading ? "opacity-30" : ""
                  }`}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <Text className="text-black font-CircularStd text-lg">
                      Verify
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPendingVerification(false)}
                  className="mt-8"
                >
                  <Text className="text-white font-CircularStd text-base">
                    Edit phone number
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
