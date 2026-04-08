"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/lib/actions/profile";
import { toast } from "sonner";
import { UserCircleIcon, GraduationCapIcon, PhoneIcon, HashIcon } from "lucide-react";

export function ProfileGeneralSettings({ profile, isAdmin }: { profile: any, isAdmin: boolean }) {
    const [isPending, startTransition] = useTransition();
    const { register, handleSubmit } = useForm({
        defaultValues: {
            fullName: profile?.fullName || "",
            aliasName: profile?.aliasName || "",
            phone: profile?.phone || "",
            avatarUrl: profile?.avatarUrl || "",
        }
    });

    const onSubmit = (data: any) => {
        startTransition(async () => {
            try {
                await updateProfile(profile.id, data);
                toast.success("Profile updated successfully");
            } catch (err) {
                toast.error("Failed to update profile");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                             <UserCircleIcon className="h-5 w-5 text-primary" />
                             <CardTitle className="text-xl font-bold">Personal Identity</CardTitle>
                        </div>
                        <CardDescription>How you are identified across the alumni network.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="id" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">System ID</Label>
                            <Input id="id" value={profile.id} disabled className="bg-muted text-[10px] font-mono border-dashed" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Official Full Name</Label>
                            <Input id="fullName" {...register("fullName")} disabled={!isAdmin} className={!isAdmin ? "bg-muted" : ""} placeholder="Enter your official name" />
                            {!isAdmin && <p className="text-[10px] text-muted-foreground font-semibold px-1">Please contact Admin to update official name.</p>}
                        </div>
                        <div className="space-y-2 p-4 bg-amber-50/50 rounded-lg border border-amber-100 ring-1 ring-amber-50 shadow-sm">
                             <div className="flex items-center gap-2 mb-1">
                                 <GraduationCapIcon className="h-4 w-4 text-amber-600" />
                                 <Label htmlFor="aliasName" className="text-[10px] font-black uppercase tracking-widest text-amber-700">School Nickname / AKA</Label>
                             </div>
                            <Input id="aliasName" {...register("aliasName")} placeholder="e.g. Master P, Kwesi J" className="bg-white border-amber-200 focus:ring-amber-200" />
                            <p className="text-[10px] text-amber-700/60 font-semibold italic mt-1 px-1">How classmates might remember you from school days.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                             <PhoneIcon className="h-5 w-5 text-primary" />
                             <CardTitle className="text-xl font-bold">Communication</CardTitle>
                        </div>
                        <CardDescription>Primary contact details for system notifications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Primary Email</Label>
                            <Input id="email" value={profile.email} disabled className="bg-muted font-semibold text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Phone Contact</Label>
                            <Input id="phone" {...register("phone")} placeholder="+233 XXX XXX XXX" />
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg flex gap-4 items-center border border-muted-foreground/10 ring-1 ring-muted/20">
                             <HashIcon className="h-6 w-6 text-primary shrink-0 opacity-40 shadow-sm" />
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Verification Status</p>
                                <p className="font-black text-sm text-emerald-600 tracking-widest uppercase">Member Verified</p>
                             </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isPending} className="px-12 h-12 font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                    {isPending ? "Syncing..." : "Update Profile"}
                </Button>
            </div>
        </form>
    );
}
