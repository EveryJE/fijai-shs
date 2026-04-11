"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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

function ForgotPasswordContent() {
    const { loading, sendRecoveryOtp } = useAuth();
    const searchParams = useSearchParams();
    const expired = searchParams.get("expired");

    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await sendRecoveryOtp(email);
            setSent(true);
            toast.success("Recovery email sent");
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to send email"
            );
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <CardDescription>
                    Enter your email and we'll send you a reset link.
                </CardDescription>
                {expired && (
                    <p className="mt-2 text-sm text-destructive">
                        Reset link expired. Please request a new one.
                    </p>
                )}
            </CardHeader>

            <CardContent>
                {sent ? (
                    <div className="space-y-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            We sent a password reset link to{" "}
                            <strong>{email}</strong>. Check your inbox.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setSent(false)}
                        >
                            Try a different email
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Sending…" : "Send Reset Link"}
                        </Button>
                    </form>
                )}

                <div className="mt-4 text-center">
                    <Link
                        href="/auth/login"
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        Back to login
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

export default function ForgotPasswordPage() {
    return (
        <div style={{
            backgroundImage: "url('/donate-bg.svg')",
        }} className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <Suspense fallback={<div>Loading...</div>}>
                <ForgotPasswordContent />
            </Suspense>
        </div>
    );
}
