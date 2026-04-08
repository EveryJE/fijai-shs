"use client";

import { useState } from "react";
import { toast } from "sonner";
import { convertToWebP } from "@/lib/image-utils";
import { uploadImage, UploadImageBucket } from "@/lib/actions/upload-image";

type ConvertOptions = Parameters<typeof convertToWebP>[1];

interface UseImageUploadOptions {
    /** Institutional storage bucket to upload into. Defaults to "events". */
    bucket?: UploadImageBucket;
    /** Sub-folder inside the bucket, e.g. "templates", "organizations". */
    folder?: string;
    /** Options for client-side WebP conversion (quality, maxWidth, maxHeight, maxSizeMB). */
    convertOptions?: ConvertOptions;
    /** Toggle for automatic error toast notifications (defaults to true). */
    showErrorToast?: boolean;
}

interface UseImageUploadReturn {
    isUploading: boolean;
    /**
     * Convert an image file to optimized WebP, upload it to institutional storage, 
     * and return the relative storage path. Returns `null` on failure.
     * @param file - The raw image file (JPEG/PNG/etc.)
     * @param oldPath - The old path to clean up if this is a replacement
     */
    upload: (file: File, oldPath?: string | null) => Promise<string | null>;
}

/**
 * Shared React hook for client-side image optimization and institutional storage upload.
 * Automates the heavy lifting of WebP conversion before transmission to reduce bandwidth.
 *
 * @example
 * const { isUploading, upload } = useImageUpload({
 *   bucket: "organizations",
 *   folder: "logos",
 *   convertOptions: { quality: 0.85, maxWidth: 800, maxHeight: 800, maxSizeMB: 1 },
 * });
 *
 * const path = await upload(file, currentLogoPath);
 * if (path) setOrganization(prev => ({ ...prev, logoUrl: path }));
 */
export function useImageUpload({
    bucket = "events",
    folder = "uploads",
    convertOptions,
    showErrorToast = true,
}: UseImageUploadOptions = {}): UseImageUploadReturn {
    const [isUploading, setIsUploading] = useState(false);

    async function upload(file: File, oldPath?: string | null): Promise<string | null> {
        setIsUploading(true);
        try {
            // First, optimize the image for transmission and storage
            const optimizedFile = await convertToWebP(file, convertOptions);

            const formData = new FormData();
            formData.set("file", optimizedFile);

            // Execute the server-side storage record establishment
            const result = await uploadImage(formData, {
                bucket,
                folder,
                oldPath, // Request background cleanup of the old asset
            });

            if (result.success) {
                return result.data.path;
            }

            if (showErrorToast) toast.error(result.error);
            return null;
        } catch (err) {
            console.error("Institutional upload hook failure:", err);
            if (showErrorToast) toast.error("System failed to establish an optimized storage record.");
            return null;
        } finally {
            setIsUploading(false);
        }
    }

    return { isUploading, upload };
}
