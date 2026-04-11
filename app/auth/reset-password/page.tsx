"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function ResetPasswordPage() {
    const { loading, updatePassword } = useAuth();
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        if (password !== confirm) {
            toast.error("Passwords do not match");
            return;
        }
        try {
            await updatePassword(password);
            toast.success("Password updated successfully");
            router.push("/dashboard");
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to update password"
            );
        }
    };

    return (
        <div  style={{
        backgroundImage: "url('/donate-bg.svg')",
      }} className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">
                        Set New Password
                    </CardTitle>
                    <CardDescription>
                        Choose a strong password for your account.
                    </CardDescription>
                </CardHeader>

                <CardContent>
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
                                onChange={(e) => setPassword(e.target.value)}
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
                                onChange={(e) => setConfirm(e.target.value)}
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
                </CardContent>
            </Card>
        </div>
    );
}
