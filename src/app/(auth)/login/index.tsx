import useEmailAuth from "@/hooks/useEmailAuth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithPassword, signInWithMagicLink, loading } = useEmailAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isValid = email.trim().length > 0 && password.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-[#121212]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-center px-4 py-4 relative">
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute left-4 p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold font-CircularStd">
            Log in
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
          {/* Email field */}
          <Text className="text-white text-3xl font-bold font-CircularStd mb-3">
            Email address
          </Text>
          <View className="border border-[#535353] rounded-lg mb-8 px-4 py-1 bg-[#1a1a1a]">
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="Email address"
              placeholderTextColor="#535353"
              className="text-white text-xl font-CircularStd"
              value={email}
              onChangeText={setEmail}
              selectionColor="#1DB954"
            />
          </View>

          {/* Password field */}
          <Text className="text-white text-3xl font-bold font-CircularStd mb-3">
            Password
          </Text>
          <View className="border border-[#535353] rounded-lg mb-2 px-4 py-1 bg-[#1a1a1a] flex-row items-center">
            <TextInput
              placeholder="Password"
              placeholderTextColor="#535353"
              secureTextEntry={!showPassword}
              className="flex-1 text-white text-xl font-CircularStd"
              value={password}
              onChangeText={setPassword}
              selectionColor="#1DB954"
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

          {/* Buttons */}
          <View className="items-center mt-8 gap-y-4">
            <TouchableOpacity
              onPress={() => signInWithPassword(email, password)}
              disabled={loading || !isValid}
              className={`bg-white rounded-full py-4 px-16 items-center ${
                !isValid || loading ? "opacity-40" : ""
              }`}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text className="text-black font-bold text-base font-CircularStd">
                  Log in
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => signInWithMagicLink(email)}
              disabled={loading}
              className="border border-[#535353] rounded-full py-2 mt-4 px-10 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-white font-medium text-base font-CircularStd">
                Log in without password
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
