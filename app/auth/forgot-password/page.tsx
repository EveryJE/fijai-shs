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
        <Card className="w-full max-w-md border-none border-secondary-400">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center p-2">
                    <img
                        src="/logo.png"
                        alt="Fijai SHS"
                        className="w-16 h-16 object-contain"
                    />
                </div>
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <CardDescription>
                    Enter your institutional email and we'll send you a recovery link.
                </CardDescription>
                {expired && (
                    <p className="mt-2 text-sm text-destructive font-medium bg-destructive/10 py-1 px-3 rounded-full inline-block">
                        Reset link expired. Please request a new one.
                    </p>
                )}
            </CardHeader>

            <CardContent>
                {sent ? (
                    <div className="space-y-6 text-center py-4">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            We've dispatched a recovery link to{" "}
                            <strong className="text-foreground">{email}</strong>. Please check your inbox and spam folder.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setSent(false)}
                        >
                            Use a different email
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Identifier</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@alumni.example"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold"
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Send Recovery Link"}
                        </Button>
                    </form>
                )}

                {!sent && (
                    <div className="mt-8 pt-6 border-t text-center">
                        <Link
                            href="/auth/login"
                            className="text-sm text-[#730303] hover:underline font-medium"
                        >
                            Return to sign in
                        </Link>
                    </div>
                )}
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
