"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
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

function LoginContent() {
    const { loading, signInWithPassword } = useAuth();
    const searchParams = useSearchParams();
    const verified = searchParams.get("verified");
    const emailParam = searchParams.get("email");

    const [email, setEmail] = useState(emailParam || "");
    const [password, setPassword] = useState("");

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signInWithPassword(email, password);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Invalid credentials"
            );
        }
    };

    return (
        <div  style={{
        backgroundImage: "url('/donate-bg.svg')",
      }} className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-md border-none border-secondary-400">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center p-2">
                        <img
                            src="/logo.png"
                            alt="Fijai SHS"
                            className="w-16 h-16 object-contain"
                        />
                    </div>
                    <CardTitle className="text-2xl">Welcome Back</CardTitle>
                    <CardDescription>
                        Fijai SHS Alumni Fundraising
                    </CardDescription>
                    {verified && (
                        <p className="mt-2 text-sm text-green-600">
                            Email verified! You can now sign in.
                        </p>
                    )}
                </CardHeader>

                <CardContent>
                    <form
                        onSubmit={handlePasswordLogin}
                        className="mt-4 space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">
                                    Password
                                </Label>
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-xs text-muted-foreground hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Signing in…" : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}
