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

  // Returns true if email is available (not registered), false otherwise
  const checkEmailAvailable = async (email: string): Promise<boolean> => {
    setCheckingEmail(true);
    setEmailError(null);
    try {
      // signInWithOtp with shouldCreateUser: false will error if user doesn't exist
      // and succeed (send OTP) if user exists — we use this to detect existing accounts
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });

      if (!error) {
        // OTP was sent → email already registered
        setEmailError(
          "An account with this email already exists. Try logging in.",
        );
        return false;
      }

      // "Email not confirmed" or similar → also already registered
      if (
        error.message.toLowerCase().includes("email") ||
        error.message.toLowerCase().includes("user") ||
        error.message.toLowerCase().includes("invalid")
      ) {
        // "Invalid login credentials" means user does NOT exist → available
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          return true;
        }
        setEmailError(
          "An account with this email already exists. Try logging in.",
        );
        return false;
      }

      return true;
    } catch {
      // Network or unexpected error — allow proceeding
      return true;
    } finally {
      setCheckingEmail(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ): Promise<boolean> => {
    setSigningUp(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });
      if (error) {
        if (
          error.message.toLowerCase().includes("already") ||
          error.message.toLowerCase().includes("registered")
        ) {
          setEmailError("An account with this email already exists.");
        }
        return false;
      }
      return true;
    } catch {
      return false;
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
  };
};

export default useSignUp;
