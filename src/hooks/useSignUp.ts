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
  const [signingUp, setSigningUp] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    setEmailError(null);
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) setEmailError("Please enter a valid email address.");
    return valid;
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string }> => {
    setSigningUp(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("already") ||
          error.message.toLowerCase().includes("registered")
        ) {
          const msg =
            "An account with this email already exists. Try logging in.";
          setEmailError(msg);
          return { success: false, error: msg };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Call a security definer RPC — bypasses RLS, works before email confirmation
        const { error: profileError } = await supabase.rpc("create_profile", {
          user_id: data.user.id,
          user_email: email,
          display_name: String(metadata?.display_name ?? ""),
          dob: String(metadata?.dob ?? ""),
          gender: String(metadata?.gender ?? ""),
          no_marketing: Boolean(metadata?.no_marketing ?? false),
          share_data: Boolean(metadata?.share_data ?? false),
        });

        if (profileError)
          return { success: false, error: profileError.message };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message ?? "Unexpected error" };
    } finally {
      setSigningUp(false);
    }
  };

  return { validateEmail, signUp, signingUp, emailError, setEmailError };
};

export default useSignUp;
