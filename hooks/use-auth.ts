"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { buildAuthCallbackUrl } from "@/lib/auth";

export function useAuth() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const signInWithPassword = async (email: string, password: string) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            router.push("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: buildAuthCallbackUrl("signup"),
                },
            });
            if (error) throw error;
        } finally {
            setLoading(false);
        }
    };

    const signInWithOAuth = async (provider: "google") => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: buildAuthCallbackUrl(),
            },
        });
        if (error) setLoading(false);
    };

    const sendRecoveryOtp = async (email: string) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: buildAuthCallbackUrl("recovery"),
            });
            if (error) throw error;
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (
        email: string,
        token: string,
        type: "email" | "recovery"
    ) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token,
                type,
            });
            if (error) throw error;
        } finally {
            setLoading(false);
        }
    };

    const updatePassword = async (newPassword: string) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (error) throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    return {
        loading,
        signInWithPassword,
        signUp,
        signInWithOAuth,
        sendRecoveryOtp,
        verifyOtp,
        updatePassword,
        signOut,
    };
}
