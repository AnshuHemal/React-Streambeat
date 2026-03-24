import { getPasswordRules, isPasswordValid } from "@/hooks/useSignUp";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function SignUpPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const rules = getPasswordRules(password);
  const allValid = isPasswordValid(password);

  const onNext = () => {
    if (!allValid) return;
    router.push({
      pathname: "/(auth)/signup/dob",
      params: { email, password },
    });
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
          <Text className="text-white text-lg font-bold ">Create account</Text>
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
          <Text className="text-white text-3xl font-bold  mb-2">
            Create a password
          </Text>
          <Text className="text-[#a7a7a7] text-sm  mb-6">For {email}</Text>

          <View className="border border-[#535353] rounded-lg px-4 py-1 bg-[#1a1a1a] flex-row items-center mb-6">
            <TextInput
              autoFocus
              placeholder="Password"
              placeholderTextColor="#535353"
              secureTextEntry={!showPassword}
              className="flex-1 text-white text-xl "
              value={password}
              onChangeText={setPassword}
              selectionColor="#1DB954"
              returnKeyType="done"
              onSubmitEditing={onNext}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          <View className="gap-y-3 mb-10">
            {rules.map((rule) => (
              <View key={rule.label} className="flex-row items-center gap-x-3">
                <View
                  className={`w-5 h-5 rounded-full items-center justify-center ${
                    rule.valid ? "bg-[#1DB954]" : "bg-[#2a2a2a]"
                  }`}
                >
                  {rule.valid && (
                    <Ionicons name="checkmark" size={13} color="black" />
                  )}
                </View>
                <Text
                  className={`text-sm  ${
                    rule.valid ? "text-white" : "text-[#a7a7a7]"
                  }`}
                >
                  {rule.label}
                </Text>
              </View>
            ))}
          </View>

          <View className="items-center">
            <TouchableOpacity
              onPress={onNext}
              disabled={!allValid}
              className={`bg-white rounded-full py-4 px-16 items-center ${
                !allValid ? "opacity-40" : ""
              }`}
              activeOpacity={0.85}
            >
              <Text className="text-black font-bold text-base ">Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
