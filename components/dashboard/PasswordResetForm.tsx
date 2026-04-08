"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { KeyIcon, ShieldCheckIcon } from "lucide-react";

export function PasswordResetForm() {
    const { loading, updatePassword } = useAuth();
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
            setPassword("");
            setConfirm("");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update password");
        }
    };

    return (
        <Card className="border-none shadow-md">
            <CardHeader>
                <div className="flex items-center gap-2">
                     <KeyIcon className="h-5 w-5 text-primary" />
                     <CardTitle>Security & Password</CardTitle>
                </div>
                <CardDescription>Update your account password to stay secure.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
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
                        <Label htmlFor="confirm">Confirm New Password</Label>
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
                    <Button type="submit" disabled={loading} className="w-full sm:w-auto px-8 font-bold uppercase tracking-widest">
                        {loading ? "Updating..." : "Update Password"}
                    </Button>
                </form>

                <div className="mt-8 p-4 bg-muted/30 rounded-lg flex gap-4 items-start border border-muted-foreground/10">
                    <ShieldCheckIcon className="h-6 w-6 text-primary shrink-0" />
                    <div className="text-xs text-muted-foreground leading-relaxed">
                         <p className="font-bold text-foreground mb-1">Security Recommendation</p>
                         Use a password that is unique to this site and at least 12 characters long for maximum security.
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
