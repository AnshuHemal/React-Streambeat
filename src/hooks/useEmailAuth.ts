import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { toast } from "sonner-native";

const useEmailAuth = () => {
  const [loading, setLoading] = useState(false);

  const signInWithPassword = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error("Login failed", { description: error.message });
      } else {
        toast.success("Welcome back!", {
          description: "Logged in successfully.",
        });
        router.replace("/");
      }
    } catch (err: any) {
      toast.error("Login failed", {
        description: err?.message ?? "Sign in failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  const signInWithMagicLink = async (email: string) => {
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Magic link sent", {
          description: "Check your email to sign in.",
        });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send magic link.");
    } finally {
      setLoading(false);
    }
  };

  return { signInWithPassword, signInWithMagicLink, loading };
};

export default useEmailAuth;
