"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile } from "@/lib/actions/profile";
import { uploadImage } from "@/lib/actions/upload-image";
import { getPublicUrlSync } from "@/lib/storage-utils";
import { ImageDropzone } from "@/components/shared/ImageDropzone";
import { toast } from "sonner";
import { 
    UserCircleIcon, 
    GraduationCapIcon, 
    PhoneIcon, 
    AtSignIcon, 
    CameraIcon,
    ShieldCheckIcon,
    CheckCircle2Icon,
    SparklesIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../ui/status-badge";

interface ProfileGeneralSettingsProps {
    profile: any;
    isAdmin: boolean;
}

export function ProfileGeneralSettings({ profile, isAdmin }: ProfileGeneralSettingsProps) {
    const [isPending, startTransition] = useTransition();
    
    const { register, handleSubmit, watch, setValue } = useForm({
        defaultValues: {
            fullName: profile?.fullName || "",
            aliasName: profile?.aliasName || "",
            phone: profile?.phone || "",
            avatarUrl: profile?.avatarUrl || "",
            classYear: profile?.classYear || "",
        }
    });

    const isRSVP = profile?.roles?.includes("rsvp");
    const isCardholder = profile?.roles?.includes("cardholder");

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

    const watchAvatar = watch("avatarUrl");

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="relative">
                    <Avatar className="h-32 w-32 border shadow-lg ring-4 ring-background">
                        <AvatarImage src={watchAvatar?.startsWith("http") ? watchAvatar : getPublicUrlSync("avatars", watchAvatar) || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                            {(profile?.fullName || "U").charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-background p-2 rounded-lg shadow border">
                        <CameraIcon className="h-4 w-4 text-primary" />
                    </div>
                </div>

                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-foreground">Identity Profile</h2>
                        <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200 uppercase">
                             Verified
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-xl">
                        Manage how you are identified across the Fijai SHS alumni network. Your details help classmates recognize you.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="pt-0">
                    <CardHeader className="pb-4 border-b rounded-t-none border-t-0 bg-primary/5 py-2">
                        <div className="flex items-center gap-2">
                             <UserCircleIcon className="h-5 w-5 text-primary" />
                             <CardTitle className="text-lg">Personal Identity</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Full Legal Name</Label>
                            <Input 
                                {...register("fullName")} 
                                disabled={!isAdmin} 
                                className={cn(!isAdmin && "bg-muted")} 
                            />
                            {!isAdmin && (
                                <p className="text-[10px] text-muted-foreground italic">
                                    Official name is locked. Contact admin for updates.
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-semibold">Profile Picture</Label>
                            <ImageDropzone 
                                maxFiles={1}
                                gridCols="grid-cols-1"
                                className="w-full"
                                description="Classmates recognize you faster with a photo. Max 5MB."
                                uploadLabel="Institutional Asset Upload"
                                uploadSubLabel="Drag your profile photo here"
                                initialFiles={watchAvatar ? [{
                                    id: watchAvatar,
                                    url: getPublicUrlSync("avatars", watchAvatar) || watchAvatar
                                }] : []}
                                getDisplayUrl={(path) => getPublicUrlSync("avatars", path)}
                                onDropFile={async (file) => {
                                    const formData = new FormData();
                                    formData.append("file", file);
                                    
                                    const result = await uploadImage(formData, {
                                        bucket: "avatars",
                                        folder: "profiles",
                                        oldPath: watchAvatar
                                    });

                                    if (result.success) {
                                        setValue("avatarUrl", result.data.path);
                                        return { status: "success", result: result.data.path };
                                    }
                                    return { status: "error", error: result.error };
                                }}
                                onRemoveInitialFile={() => setValue("avatarUrl", "")}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold flex items-center gap-1.5">
                                    <GraduationCapIcon className="h-3.5 w-3.5" />
                                    Class Year
                                </Label>
                                <Input 
                                    {...register("classYear")} 
                                    placeholder="e.g. 2008" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold flex items-center gap-1.5">
                                    <SparklesIcon className="h-3.5 w-3.5" />
                                    Nickname / AKA
                                </Label>
                                <Input 
                                    {...register("aliasName")} 
                                    placeholder="e.g. Master P" 
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="pt-0">
                    <CardHeader className="pb-4 border-b rounded-t-none border-t-0 bg-primary/5 py-2">
                        <div className="flex items-center gap-2">
                             <PhoneIcon className="h-5 w-5 text-primary" />
                             <CardTitle className="text-lg">Communication</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                                <AtSignIcon className="h-3.5 w-3.5" />
                                Primary Email
                            </Label>
                            <Input value={profile.email} disabled className="bg-muted text-muted-foreground" />
                        </div>
                        
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                                <PhoneIcon className="h-3.5 w-3.5" />
                                Contact Number
                            </Label>
                            <Input {...register("phone")} placeholder="+233 XX XXX XXXX" />
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label className="text-xs font-semibold">Assigned Roles</Label>
                            <div className="flex flex-wrap gap-2">
                                {profile?.roles?.map((role: string) => (
                                   <StatusBadge
                                   showIcon={false}
                                      key={role}
                                      variant={role || "Cardholder"}
                                      text={role || "Cardholder"}
                                      className=""
                                   />
                                ))}
                            </div>
                        </div>

                        {(isRSVP || isCardholder) && (
                            <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:scale-[1.7] transition-transform duration-500">
                                    <CheckCircle2Icon className="h-12 w-12 text-primary" />
                                </div>
                                <div className="relative">
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Impact Tracking Active</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        As an active {isRSVP ? "referral partner" : "cardholder"}, your contributions are tracked across the institutional network.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end pt-4 border-t">
                <Button 
                    type="submit" 
                    disabled={isPending} 
                    className="min-w-[200px] h-11 font-semibold"
                >
                    {isPending ? "Updating..." : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}
