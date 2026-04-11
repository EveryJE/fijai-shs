"use client";

import { useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile } from "@/lib/actions/profile";
import { useImageUpload } from "@/lib/hooks/use-image-upload";
import { getPublicUrlSync } from "@/lib/storage-utils";
import { toast } from "sonner";
import { 
    UserCircleIcon, 
    GraduationCapIcon, 
    PhoneIcon, 
    AtSignIcon, 
    CameraIcon,
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
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Initialize the advanced image upload hook for Fijai institutional storage
    const { isUploading, upload: performUpload } = useImageUpload({
        bucket: "avatars",
        folder: "profiles",
        convertOptions: { quality: 0.8, maxWidth: 400, maxHeight: 400, maxSizeMB: 0.5 }
    });
    
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
        if (isUploading) return;
        fileInputRef.current?.click();
    }

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Execute optimized upload via institutional hook
        const path = await performUpload(file, watchAvatar);
        
        if (path) {
            setValue("avatarUrl", path);
            toast.success("Identity photo updated");
        }
        
        // Clear input to allow re-uploading same file if needed
        if (fileInputRef.current) fileInputRef.current.value = "";
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
                        
                        {/* High-fidelity Hover Overlay */}
                        <div className={cn(
                            "absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-opacity duration-200",
                            isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                            {isUploading ? (
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                            ) : (
                                <>
                                    <CameraIcon className="h-8 w-8 text-white mb-1" />
                                    <span className="text-[10px] font-black   text-white">Update Identity</span>
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
                        <h2 className="text-2xl font-semibold text-[#730303] ">Identity Profile</h2>
                        <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black border border-emerald-200  ">
                             Verified
                        </div>
                    </div>
                    <p className="text-sm max-w-xl ">
                        Manage your Fijai SHS alumni identity. Profiles with professional photos receive 4x more engagement within the institutional network.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="pt-0 border-none shadow-xl shadow-gray-200/50">
                    <CardHeader className="border-b rounded-none border-t-0 bg-primary/5 py-4">
                        <div className="flex items-center gap-2">
                             <UserCircleIcon className="h-5 w-5 text-primary" />
                             <h3 className="font-medium   text-base text-primary">Personal Identity</h3>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-sm">Full Legal Name</Label>
                            <Input 
                                {...register("fullName")} 
                                disabled={!isAdmin} 
                                className={cn("", !isAdmin && "bg-muted font-bold opacity-80")} 
                                placeholder="Formal name"
                            />
                            {!isAdmin && (
                                <p className="text-[10px] text-muted-foreground font-black   opacity-60">
                                    Official name is locked. Contact admin for updates.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="">
                                    <GraduationCapIcon className="h-3.5 w-3.5 text-primary" />
                                    Class Year
                                </Label>
                                <Input 
                                    {...register("classYear")} 
                                    className=""
                                    placeholder="e.g. 2008" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="">
                                    <SparklesIcon className="h-3.5 w-3.5 text-primary" />
                                    Nickname
                                </Label>
                                <Input 
                                    {...register("aliasName")} 
                                    className=""
                                    placeholder="School alias" 
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="pt-0 border-none shadow-xl shadow-gray-200/50">
                    <CardHeader className="pb-4 border-b rounded-none border-t-0 bg-primary/5 py-4">
                        <div className="flex items-center gap-2">
                             <PhoneIcon className="h-5 w-5 text-primary" />
                             <h3 className="font-medium  text-base text-primary">Communication</h3>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label className="">
                                <AtSignIcon className="h-3.5 w-3.5 text-primary" />
                                Primary Email
                            </Label>
                            <Input value={profile.email} disabled className="" />
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="">
                                <PhoneIcon className="h-3.5 w-3.5 text-primary" />
                                Contact Number
                            </Label>
                            <Input {...register("phone")} className="" placeholder="+233 XX XXX XXXX" />
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label className="">Assigned Institutional Roles</Label>
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
                            <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:scale-[1.7] transition-transform duration-500">
                                    <CheckCircle2Icon className="h-12 w-12 text-emerald-600" />
                                </div>
                                <div className="relative">
                                    <p className="text-[9px] font-black text-emerald-800  tracking-[2px] mb-1">Impact Tracking Active</p>
                                    <p className="text-[11px] text-emerald-900/60 font-medium leading-relaxed">
                                        As an active {isRSVP ? "referral partner" : "cardholder"}, your contributions are tracked across the Fijai institutional network.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end pt-8 mt-4 border-t border-muted-foreground/10">
                <Button 
                    type="submit" 
                    disabled={isPending || isUploading} 
                    className=""
                >
                    {isPending ? "Syncing Identity..." : "Commit Profile Changes"}
                </Button>
            </div>
        </form>
    );
}
