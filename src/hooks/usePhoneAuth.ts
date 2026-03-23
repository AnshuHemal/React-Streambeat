import { useSignIn, useSignUp } from "@clerk/expo";
import { useState } from "react";
import { Alert } from "react-native";

const usePhoneAuth = () => {
    const { signIn } = useSignIn();
    const { signUp } = useSignUp();
    const [loading, setLoading] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);

    const handleSendCode = async (phoneNumber: string) => {
        if (!signIn || !signUp) return;

        setLoading(true);
        try {
            await (signIn as any).create({
                identifier: phoneNumber,
            });

            await (signIn as any).phoneCode.send();

            setPendingVerification(true);
        } catch (err: any) {
            console.error("Phone Sign In Error:", err);
            if (err.errors && err.errors[0]?.code === "form_identifier_not_found") {
                try {
                    await (signUp as any).create({
                        phoneNumber,
                    });

                    await (signUp as any).phoneCode.send();

                    setPendingVerification(true);
                } catch (signUpErr: any) {
                    console.error("Phone Sign Up Error:", signUpErr);
                    Alert.alert("Error", signUpErr.errors?.[0]?.message || "Something went wrong.");
                }
            } else {
                Alert.alert("Error", err.errors?.[0]?.message || "Something went wrong.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (code: string) => {
        if (!signIn || !signUp) return;

        setLoading(true);
        try {
            if ((signIn as any).status === "needs_first_factor") {
                await (signIn as any).phoneCode.authenticate({
                    code,
                });

                if ((signIn as any).status === "complete") {
                    await (signIn as any).finalize();
                }
            } else if ((signUp as any).status === "missing_requirements") {
                await (signUp as any).phoneCode.authenticate({
                    code,
                });

                if ((signUp as any).status === "complete") {
                    await (signUp as any).finalize();
                }
            }
        } catch (err: any) {
            console.error("Verification error:", err);
            Alert.alert("Error", err.errors?.[0]?.message || "Invalid verification code.");
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
