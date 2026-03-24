import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Alert } from "react-native";

const useEmailAuth = () => {
  const [loading, setLoading] = useState(false);

  const signInWithPassword = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) Alert.alert("Error", error.message);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithMagicLink = async (email: string) => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Check your email", "We sent you a magic link to sign in.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to send magic link.");
    } finally {
      setLoading(false);
    }
  };

  return { signInWithPassword, signInWithMagicLink, loading };
};

export default useEmailAuth;
