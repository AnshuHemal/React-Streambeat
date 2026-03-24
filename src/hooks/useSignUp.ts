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
        // Establish session so RLS allows the profile write
        await supabase.auth.signInWithPassword({ email, password });

        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          email,
          display_name: metadata?.display_name ?? null,
          dob: metadata?.dob ?? null,
          gender: metadata?.gender ?? null,
          no_marketing: metadata?.no_marketing ?? false,
          share_data: metadata?.share_data ?? false,
          onboarding_complete: false,
          notifications_seen: false,
          created_at: new Date().toISOString(),
        });

        if (profileError)
          return { success: false, error: profileError.message };

        // Sign out — user must verify email then log in manually
        await supabase.auth.signOut();
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
