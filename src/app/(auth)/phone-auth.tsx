import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import usePhoneAuth from "@/hooks/usePhoneAuth";
import { useState } from "react";

export default function PhoneAuthScreen() {
  const router = useRouter();
  const { 
    handleSendCode, 
    handleVerifyCode, 
    loading, 
    pendingVerification, 
    setPendingVerification 
  } = usePhoneAuth();

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

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        className="flex-1"
      >
        <View className="flex-1 px-6">
          {/* Back Button */}
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

          <Text className="text-white text-3xl font-bold font-CircularStd mb-8">
            {!pendingVerification ? "Enter your phone number" : "Check your SMS"}
          </Text>

          {!pendingVerification ? (
            <View>
              <View className="flex-row items-center border-b border-gray-600 pb-2 mb-8">
                <Text className="text-white text-lg font-CircularStd mr-2">+1</Text>
                <TextInput
                  autoFocus
                  keyboardType="phone-pad"
                  placeholder="Phone number"
                  placeholderTextColor="#666"
                  className="flex-1 text-white text-lg font-CircularStd"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  selectionColor="#1DB954"
                />
              </View>
              <TouchableOpacity
                onPress={onSendCode}
                disabled={loading || phoneNumber.length < 10}
                className={`bg-[#1DB954] rounded-full py-4 items-center ${
                  phoneNumber.length < 10 || loading ? "opacity-50" : ""
                }`}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <Text className="text-black font-bold text-lg font-CircularStd">Next</Text>
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
                  className="flex-1 text-white text-lg font-CircularStd text-center tracking-[8px]"
                  maxLength={6}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  selectionColor="#1DB954"
                />
              </View>
              <TouchableOpacity
                onPress={onVerifyCode}
                disabled={loading || verificationCode.length < 6}
                className={`bg-[#1DB954] rounded-full py-4 items-center ${
                  verificationCode.length < 6 || loading ? "opacity-50" : ""
                }`}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <Text className="text-black font-bold text-lg font-CircularStd">Verify</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setPendingVerification(false)}
                className="mt-6 items-center"
              >
                <Text className="text-white font-medium font-CircularStd text-lg">Edit phone number</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text className="text-gray-400 text-xs mt-6 text-center font-CircularStd">
            You'll receive an SMS to verify your number. Standard rates apply.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
