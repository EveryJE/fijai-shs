"use client";

import { useState, useRef } from "react";
import { CameraIcon, Loader2, XIcon, ImageIcon } from "lucide-react";
import { useImageUpload } from "@/lib/hooks/use-image-upload";
import { getPublicUrlSync } from "@/lib/storage-utils";
import { cn } from "@/lib/utils";

interface GoogleFormFileUploadProps {
    value?: string;
    onChange: (path: string) => void;
    label?: string;
    bucket?: string;
    folder?: string;
}

/**
 * Reusable File Upload for Google-Style Forms
 * Integrated with the Fijai optimization hook (WebP conversion).
 */
export function GoogleFormFileUpload({ 
    value, 
    onChange, 
    label = "Share a Moment", 
    bucket = "events", 
    folder = "moments" 
}: GoogleFormFileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isUploading, upload } = useImageUpload({
        bucket: bucket as any,
        folder,
        convertOptions: { quality: 0.8, maxWidth: 1000, maxHeight: 1000, maxSizeMB: 1 }
    });

    const displayUrl = value?.startsWith("http") 
        ? value 
        : (getPublicUrlSync(bucket as any, value) || null);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const path = await upload(file, value);
        if (path) {
            onChange(path);
        }
        
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    return (
        <div className="space-y-4">
            <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={cn(
                    "relative border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 transition-all flex flex-col items-center justify-center cursor-pointer hover:bg-muted/5",
                    isUploading && "opacity-60 cursor-not-allowed",
                    displayUrl && "border-primary/20 bg-primary/5"
                )}
            >
                {displayUrl ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border shadow-sm">
                        <img src={displayUrl} alt="Uploaded moment" className="w-full h-full object-cover" />
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange("");
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
                        >
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        {isUploading ? (
                            <Loader2 className="h-10 w-10 text-primary animate-spin mb-3 mx-auto" />
                        ) : (
                            <ImageIcon className="h-10 w-10 text-muted-foreground/30 mb-3 mx-auto" />
                        )}
                        <p className="text-sm">
                            {isUploading ? "Optimizing..." : label}
                        </p>
                        <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-tight">
                            JPEG, PNG or WebP (Max 5MB)
                        </p>
                    </div>
                )}
                
                <input 
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
        </div>
    );
}
