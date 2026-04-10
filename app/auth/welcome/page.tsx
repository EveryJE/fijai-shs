"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ShieldCheck, Mail, Key } from "lucide-react"

function WelcomeContent() {
    const searchParams = useSearchParams()
    const email = searchParams.get("email") || ""

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="max-w-md w-full border-none shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                        <img 
                            src="/logo.png" 
                            alt="Fijai SHS Logo" 
                            className="w-16 h-16 object-contain"
                        />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-3xl font-black text-primary">Welcome to the Alumni Platform</CardTitle>
                        <CardDescription className="text-base">
                            Your official account has been created successfully.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-muted p-4 rounded-lg flex gap-4 items-start border border-muted-foreground/10">
                        <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-sm">Secure Activation</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                You have been authorized as a key participant for our fundraising events.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">How to Log In</h3>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-secondary-foreground">1</div>
                            <div className="flex-1 flex items-center gap-2">
                                <Mail className="h-4 w-4 opacity-50" />
                                <span>Use your email: <strong>{email}</strong></span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-secondary-foreground">2</div>
                            <div className="flex-1 flex items-center gap-2">
                                <Key className="h-4 w-4 opacity-50" />
                                <span>Default password is your <strong>email address</strong></span>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-md border border-amber-100 flex gap-3">
                         <div className="h-2 w-2 rounded-full bg-amber-400 mt-1.5" />
                         <p className="text-xs text-amber-800 leading-normal">
                            For security purposes, you will be required to change your password immediately after logging in.
                         </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Link href={`/auth/login?email=${encodeURIComponent(email)}`} className="w-full">
                        <Button className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20">
                            Proceed to Login
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}

export default function WelcomePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WelcomeContent />
        </Suspense>
    )
}
