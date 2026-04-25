"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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

import { sendPasswordResetAction, verifyPasswordResetOTP } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";

function ForgotPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const expired = searchParams.get("expired");

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"email" | "otp">("email");
    const [loading, setLoading] = useState(false);

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await sendPasswordResetAction(email);
            if (result.success) {
                setStep("otp");
                toast.success("Recovery code sent to your email");
            } else {
                toast.error(result.error || "Failed to send code");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await verifyPasswordResetOTP(email, otp);
            if (result.success) {
                // Redirect to reset password page with email and otp as params
                router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
            } else {
                toast.error(result.error || "Invalid code");
            }
        } catch (err) {
            toast.error("Verification failed");
        } finally {
            setLoading(false);
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
                    {step === "email" 
                        ? "Enter your institutional email and we'll send you a recovery code." 
                        : "Enter the 6-digit recovery code we sent to your email."}
                </CardDescription>
                {expired && (
                    <p className="mt-2 text-sm text-destructive font-medium bg-destructive/10 py-1 px-3 rounded-full inline-block">
                        Session expired. Please request a new code.
                    </p>
                )}
            </CardHeader>

            <CardContent>
                {step === "email" ? (
                    <form onSubmit={handleSendEmail} className="space-y-4">
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
                            {loading ? "Processing..." : "Send Recovery Code"}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp">Recovery Code</Label>
                            <Input
                                id="otp"
                                type="text"
                                placeholder="123456"
                                required
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="h-12 text-center text-2xl tracking-[0.5em] font-bold"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold"
                            disabled={loading}
                        >
                            {loading ? "Verifying..." : "Verify Code"}
                        </Button>
                        <button
                            type="button"
                            onClick={() => setStep("email")}
                            className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            Didn't get a code? Try again
                        </button>
                    </form>
                )}

                {step === "email" && (
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
