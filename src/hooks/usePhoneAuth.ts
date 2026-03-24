import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Alert } from "react-native";

const usePhoneAuth = () => {
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [phone, setPhone] = useState("");

  const handleSendCode = async (phoneNumber: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      setPhone(phoneNumber);
      setPendingVerification(true);
    } catch (err: any) {
      console.log("[PhoneAuth] Exception:", err);
      Alert.alert("Error", err?.message ?? "Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: "sms",
      });

      if (error) {
        Alert.alert("Error", error.message);
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  return {
    handleSendCode,
    handleVerifyCode,
    loading,
    pendingVerification,
    setPendingVerification,
  };
};

export default usePhoneAuth;
