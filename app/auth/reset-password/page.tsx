
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

function ResetPasswordContent() {
    const { loading, updatePassword } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Check for required params and session
    useEffect(() => {
        const accessToken = searchParams.get("access_token");
        const type = searchParams.get("type");
        const errorParam = searchParams.get("error_description") || searchParams.get("error");
        
        if (errorParam) {
            setError(errorParam.replace(/\+/g, ' '));
        } else {
            // Check if we have params OR if we are likely coming from /auth/callback (which establishes a session)
            // If neither, we show the expiration error.
            if (!accessToken && type !== "recovery") {
                // We'll also check if the user is actually authenticated
                const supabase = createClient();
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (!session) {
                        setError("This password reset link is invalid or has expired.");
                    }
                });
            }
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }
        try {
            await updatePassword(password);
            setSuccess(true);
            toast.success("Password updated successfully");
            setTimeout(() => router.push("/dashboard"), 1500);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to update password. The link may be invalid or expired.";
            setError(msg);
            toast.error(msg);
        }
    };

    const handlePasswordChange = (val: string) => {
        setPassword(val);
        if (error) setError(null);
    };

    const handleConfirmChange = (val: string) => {
        setConfirm(val);
        if (error) setError(null);
    };

    return (
        <div style={{ backgroundImage: "url('/donate-bg.svg')" }} className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Set New Password</CardTitle>
                    <CardDescription>Choose a strong password for your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded text-red-600 text-center text-xs font-medium">
                            {error}
                        </div>
                    )}
                    {success ? (
                        <div className="text-green-600 text-center font-medium bg-green-50 p-4 rounded border border-green-100">
                            ✓ Password updated! <br/>
                            <span className="text-sm opacity-80 font-normal">Redirecting you to dashboard...</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm">Confirm Password</Label>
                                <Input
                                    id="confirm"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                    value={confirm}
                                    onChange={(e) => handleConfirmChange(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? "Updating…" : "Update Password"}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Loading...</CardTitle>
                        <CardDescription>Please wait while we prepare the page.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
