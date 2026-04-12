"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrophyIcon, StarIcon, HeartHandshakeIcon } from "lucide-react";
import { getPublicUrlSync } from "@/lib/storage-utils";

interface MostImpactUserCardProps {
    user: {
        fullName: string | null;
        avatarUrl: string | null;
        uniqueCode: string | null;
    } | null;
}

export function MostImpactUserCard({ user }: MostImpactUserCardProps) {
    if (!user) return null;

    const avatarSrc = user.avatarUrl?.startsWith("http")
        ? user.avatarUrl
        : getPublicUrlSync("avatars", user.avatarUrl) || "";

    return (
        <Card className="border-none shadow-lg bg-primary text-primary-foreground overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <TrophyIcon className="w-32 h-32" />
            </div>

            <CardHeader className="relative pb-0 pt-6">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                        <StarIcon className="h-4 w-4 text-emerald-400 fill-emerald-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold uppercase ">Top Contributor</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="relative pt-6 pb-8 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-white/20 shadow-xl">
                            <AvatarImage src={avatarSrc} />
                            <AvatarFallback className="bg-white/10 text-xl font-bold">
                                {(user.fullName || "A").charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-secondary p-1 rounded-full shadow border-2 border-primary">
                            <TrophyIcon className="h-3 w-3 text-secondary-foreground" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xl font-bold leading-none">{user.fullName || "Alumni Member"}</p>
                        <p className="text-xs text-primary-foreground/60 mt-1 uppercase font-medium tracking-wide">Verified Supporter</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <p className="text-[10px] uppercase font-semibold opacity-60 mb-1">Impact Level</p>
                        <p className="text-sm font-bold text-emerald-400">Elite Tier</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <p className="text-[10px] uppercase font-semibold opacity-60 mb-1">Alumni Code</p>
                        <p className="text-sm font-bold uppercase">{user.uniqueCode || "N/A"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-2 text-[10px] font-medium uppercase  opacity-60">
                    <HeartHandshakeIcon className="h-3 w-3" />
                    Institutionally Recognized Milestone
                </div>
            </CardContent>
        </Card>
    );
}
