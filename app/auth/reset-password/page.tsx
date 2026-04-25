
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

import { resetPasswordWithOTP } from "@/lib/actions/auth";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const email = searchParams.get("email");
    const otp = searchParams.get("otp");

    // Check for required params
    useEffect(() => {
        if (!email || !otp) {
            setError("Invalid session. Please start the password reset process again.");
        }
    }, [email, otp]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !otp) return;
        
        setError(null);
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const result = await resetPasswordWithOTP({
                email,
                otp,
                newPassword: password
            });

            if (result.success) {
                setSuccess(true);
                toast.success("Password updated successfully");
                setTimeout(() => router.push("/dashboard"), 1500);
            } else {
                setError(result.error || "Failed to update password.");
                toast.error(result.error || "Failed to update password.");
            }
        } catch (err) {
            const msg = "An unexpected error occurred.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
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
            <Card className="w-full max-w-md border-none border-secondary-400">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center p-2">
                        <img
                            src="/logo.png"
                            alt="Fijai SHS"
                            className="w-16 h-16 object-contain"
                        />
                    </div>
                    <CardTitle className="text-2xl">Set New Password</CardTitle>
                    <CardDescription>Secure your institutional account with a new password.</CardDescription>
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
