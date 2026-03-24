import { supabase } from "@/lib/supabase";
import { useState } from "react";

export type PasswordRule = {
  label: string;
  valid: boolean;
};

export const getPasswordRules = (password: string): PasswordRule[] => [
  { label: "At least 8 characters", valid: password.length >= 8 },
  { label: "At least one uppercase letter", valid: /[A-Z]/.test(password) },
  { label: "At least one lowercase letter", valid: /[a-z]/.test(password) },
  { label: "At least one number", valid: /[0-9]/.test(password) },
  {
    label: "At least one special character",
    valid: /[^A-Za-z0-9]/.test(password),
  },
];

export const isPasswordValid = (password: string) =>
  getPasswordRules(password).every((r) => r.valid);

const useSignUp = () => {
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);

  // Basic format validation only — no OTP/email send
  const checkEmailAvailable = async (email: string): Promise<boolean> => {
    setCheckingEmail(true);
    setEmailError(null);
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError("Please enter a valid email address.");
        return false;
      }
      return true;
    } finally {
      setCheckingEmail(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string }> => {
    setSigningUp(true);
    setSignUpError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("already") ||
          error.message.toLowerCase().includes("registered") ||
          error.message.toLowerCase().includes("already registered")
        ) {
          const msg =
            "An account with this email already exists. Try logging in.";
          setEmailError(msg);
          return { success: false, error: msg };
        }
        setSignUpError(error.message);
        return { success: false, error: error.message };
      }

      // Write extended profile data to profiles table
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          email,
          display_name: metadata?.display_name ?? null,
          dob: metadata?.dob ?? null,
          gender: metadata?.gender ?? null,
          no_marketing: metadata?.no_marketing ?? false,
          share_data: metadata?.share_data ?? false,
          onboarding_complete: false,
          created_at: new Date().toISOString(),
        });

        if (profileError) {
          setSignUpError(profileError.message);
          return { success: false, error: profileError.message };
        }

        // Auto sign-in immediately after signup
        await supabase.auth.signInWithPassword({ email, password });
      }

      return { success: true };
    } catch (e: any) {
      const msg = e?.message ?? "Unexpected error";
      setSignUpError(msg);
      return { success: false, error: msg };
    } finally {
      setSigningUp(false);
    }
  };

  return {
    checkEmailAvailable,
    signUp,
    checkingEmail,
    signingUp,
    emailError,
    setEmailError,
    signUpError,
  };
};

export default useSignUp;
