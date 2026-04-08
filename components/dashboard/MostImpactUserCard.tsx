"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrophyIcon, StarIcon, HeartHandshakeIcon } from "lucide-react";

interface MostImpactUserCardProps {
    user: {
        fullName: string | null;
        avatarUrl: string | null;
        uniqueCode: string | null;
    } | null;
}

export function MostImpactUserCard({ user }: MostImpactUserCardProps) {
    if (!user) return null;

    return (
        <Card className="border-none shadow-2xl bg-gradient-to-br from-[#730303] via-[#730303] to-[#DAA520] text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <TrophyIcon className="w-32 h-32" />
            </div>
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <CardHeader className="relative pb-0 pt-8">
                <div className="flex items-center gap-3">
                     <div className="bg-white/20 p-2 rounded-lg border border-white/20 backdrop-blur-md">
                        <StarIcon className="h-5 w-5 text-[#DAA520]" />
                     </div>
                     <CardTitle className="text-sm font-black uppercase tracking-[3px] text-white/90">Institutional Impact</CardTitle>
                </div>
                <CardDescription className="text-white/60 font-bold uppercase tracking-wider text-[10px] mt-2">Top Contributing Alumni Member</CardDescription>
            </CardHeader>
            <CardContent className="relative pt-8 pb-10 space-y-6">
                <div className="flex items-end gap-6 justify-between border-b border-white/10 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-20 w-20 border-4 border-white/20 shadow-2xl">
                                <AvatarImage src={user.avatarUrl || ""} />
                                <AvatarFallback className="bg-white/10 text-xl font-bold uppercase">
                                    {(user.fullName || "A").charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 bg-[#DAA520] p-1.5 rounded-full shadow-lg border-2 border-white/20">
                                <TrophyIcon className="h-3.5 w-3.5 text-white" />
                            </div>
                        </div>
                        <div className="space-y-1">
                             <p className="text-2xl font-black tracking-tight">{user.fullName || "Alumni Member"}</p>
                             <p className="text-[10px] font-black uppercase tracking-widest text-[#DAA520]">Verified Supporter</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                         <p className="text-[8px] font-black uppercase tracking-widest text-white/50 mb-1">Impact Level</p>
                         <p className="text-lg font-black tracking-tight text-[#DAA520]">Elite Tier</p>
                     </div>
                     <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                         <p className="text-[8px] font-black uppercase tracking-widest text-white/50 mb-1">Alumni Code</p>
                         <p className="text-lg font-black tracking-tight uppercase">{user.uniqueCode || "N/A"}</p>
                     </div>
                </div>

                <div className="flex items-center gap-2 pt-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                     <HeartHandshakeIcon className="h-3 w-3" />
                     Institutionally Recognized Achievement
                </div>
            </CardContent>
        </Card>
    );
}
