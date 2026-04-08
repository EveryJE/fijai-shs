import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function AuthCodeErrorPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">
                        Authentication Error
                    </CardTitle>
                    <CardDescription>
                        The link you followed is invalid or has expired.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        className="w-full"
                        render={
                            <Link href="/auth/login">Back to Login</Link>
                        }
                    />
                </CardContent>
            </Card>
        </div>
    );
}
