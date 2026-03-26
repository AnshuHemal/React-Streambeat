import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { toast } from "sonner-native";

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
        toast.error(error.message);
        return;
      }
      setPhone(phoneNumber);
      setPendingVerification(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send code.");
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
      if (error) toast.error(error.message);
    } catch (err: any) {
      toast.error(err?.message ?? "Invalid verification code.");
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
