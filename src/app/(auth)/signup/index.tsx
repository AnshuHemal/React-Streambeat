import useSignUp from "@/hooks/useSignUp";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpEmailScreen() {
  const router = useRouter();
  const { validateEmail, emailError, setEmailError } = useSignUp();

  const [email, setEmail] = useState("");

  const emailValid =
    email.trim().length > 0 && email.includes("@") && email.includes(".");

  const onNext = () => {
    if (!emailValid) return;
    const valid = validateEmail(email.trim().toLowerCase());
    if (valid) {
      router.push({
        pathname: "/(auth)/signup/password",
        params: { email: email.trim().toLowerCase() },
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center justify-center px-4 py-4 relative">
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute left-4 p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-CircularStd ">
            Create account
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-white text-3xl font-CircularStd  mb-2">
            What's your email?
          </Text>

          <View
            className={`border rounded-lg px-4 py-1 bg-[#1a1a1a] mb-2 ${
              emailError ? "border-[#e91429]" : "border-[#535353]"
            }`}
          >
            <TextInput
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="Email address"
              placeholderTextColor="#535353"
              className="text-white text-xl "
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (emailError) setEmailError(null);
              }}
              selectionColor="#1DB954"
              onSubmitEditing={onNext}
              returnKeyType="next"
            />
          </View>

          {emailError && (
            <Text className="text-[#e91429] text-sm  mb-6">{emailError}</Text>
          )}

          <Text className="text-[#a7a7a7] text-sm  mb-6">
            You'll need to confirm this email later.
          </Text>

          <View className="items-center mt-10">
            <TouchableOpacity
              onPress={onNext}
              disabled={!emailValid}
              className={`bg-white rounded-full py-4 px-16 items-center ${
                !emailValid ? "opacity-40" : ""
              }`}
              activeOpacity={0.85}
            >
              <Text className="text-black font-CircularStd text-base ">
                Next
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
