"use client";

import { useTransition, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile } from "@/lib/actions/profile";
import { uploadImage } from "@/lib/actions/upload-image";
import { getPublicUrlSync } from "@/lib/storage-utils";
import { toast } from "sonner";
import { 
    UserCircleIcon, 
    GraduationCapIcon, 
    PhoneIcon, 
    AtSignIcon, 
    CameraIcon,
    ShieldCheckIcon,
    CheckCircle2Icon,
    SparklesIcon,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../ui/status-badge";

interface ProfileGeneralSettingsProps {
    profile: any;
    isAdmin: boolean;
}

export function ProfileGeneralSettings({ profile, isAdmin }: ProfileGeneralSettingsProps) {
    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
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
    const avatarDisplayUrl = watchAvatar?.startsWith("http") 
        ? watchAvatar 
        : (getPublicUrlSync("avatars", watchAvatar) || "");

    async function handleAvatarClick() {
        fileInputRef.current?.click();
    }

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            
            const result = await uploadImage(formData, {
                bucket: "avatars",
                folder: "profiles",
                oldPath: watchAvatar
            });

            if (result.success) {
                setValue("avatarUrl", result.data.path);
                toast.success("Photo uploaded");
            } else {
                toast.error(result.error || "Upload failed");
            }
        } catch (err) {
            toast.error("Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="relative group">
                    <button
                        type="button"
                        onClick={handleAvatarClick}
                        className="relative overflow-hidden rounded-full border shadow-lg ring-4 ring-background transition-all hover:ring-primary/20"
                        disabled={isUploading}
                    >
                        <Avatar className="h-32 w-32 border-none ring-0">
                            <AvatarImage src={avatarDisplayUrl} className="object-cover" />
                            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                                {(profile?.fullName || "U").charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {isUploading ? (
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                            ) : (
                                <>
                                    <CameraIcon className="h-8 w-8 text-white mb-1" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Update</span>
                                </>
                            )}
                        </div>
                    </button>
                    
                    <input 
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />

                    {!isUploading && (
                        <div className="absolute -bottom-1 -right-1 bg-primary p-2 rounded-full shadow-lg border border-background z-10">
                            <CameraIcon className="h-3.5 w-3.5 text-white" />
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-foreground">Identity Profile</h2>
                        <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200 uppercase">
                             Verified
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-xl font-medium leading-relaxed">
                        Manage your Fijai SHS alumni identity. Classes recognize you faster with a professional profile photo.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="pt-0 ">
                    <CardHeader className="pb-4 border-b rounded-t-none border-t-0 bg-primary/5 py-3">
                        <div className="flex items-center gap-2">
                             <UserCircleIcon className="h-5 w-5 text-primary" />
                             <CardTitle className="text-lg">Personal Identity</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Legal Name</Label>
                            <Input 
                                {...register("fullName")} 
                                disabled={!isAdmin} 
                                className={cn(!isAdmin && "bg-muted font-medium opacity-80")} 
                            />
                            {!isAdmin && (
                                <p className="text-[10px] text-muted-foreground font-medium italic">
                                    Official name is locked. Contact admin for updates.
                                </p>
                            )}
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
