"use server";

import { createClient } from "@/utils/supabase/server";
import {
    STORAGE_BUCKETS,
    deleteStorageFile,
    normalizeToPath,
    StorageBucket
} from "@/lib/storage-utils";

export type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string };

export type UploadImageBucket = "events" | "avatars" | "organizations";

export interface UploadImageOptions {
    /** Institutional storage bucket to upload into. Defaults to "events". */
    bucket?: UploadImageBucket;
    /** Sub-folder prefix inside the bucket, e.g. "covers", "templates". */
    folder?: string;
    /** Existing path (or full URL) to delete before uploading the new file. */
    oldPath?: string | null;
}

/**
 * Universal institutional image upload action.
 * Returns the **storage path** (not the full public URL) to maintain path-centric database consistency.
 * Use the client-side `getPublicUrlSync` helper to derive display URLs during rendering.
 * @param formData - The FormData containing the file to upload
 * @param options - Storage configuration options
 */
export async function uploadImage(
    formData: FormData,
    options: UploadImageOptions = {}
): Promise<ActionResult<{ path: string }>> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Ensure user is authenticated for institutional data integrity
    if (!user) {
        return { success: false, error: "Administrative authentication required" };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
        return { success: false, error: "No image payload provided" };
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
        return {
            success: false,
            error: "Invalid file format. WebP, JPEG, PNG, or GIF is required.",
        };
    }

    // Limit to 5MB for institutional uploads
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return { success: false, error: "Image file exceeds the 5MB institutional limit." };
    }

    const requestedBucket = options.bucket ?? "events";
    const storageBucket = STORAGE_BUCKETS[requestedBucket.toUpperCase() as keyof typeof STORAGE_BUCKETS];

    try {
        // Immediate cleanup of previous asset if oldPath is provided
        if (options.oldPath) {
            const oldPath = normalizeToPath(options.oldPath, requestedBucket);
            if (oldPath) {
                await deleteStorageFile(storageBucket, oldPath);
            }
        }

        // ── Institutional File Path Architecture ───────────────────────────
        const folder = options.folder ?? "uploads";
        // Convert filename to WebP as client-side processing should ensure this
        const filename = `${Date.now()}.webp`;
        const ownerId = user?.id ?? "public";
        const filePath = `${ownerId}/${folder}/${filename}`;

        // ── Institutional Storage Upload ─────────────────────────────────────
        const { data, error } = await supabase.storage
            .from(storageBucket)
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
                contentType: "image/webp",
            });

        if (error) {
            console.error({ error: error.message }, "Institutional storage upload failure");
            return { success: false, error: "Failed to establish storage record" };
        }

        return { success: true, data: { path: data.path } };
    } catch (err) {
        console.error({ err }, "Unexpected institutional upload exception");
        return { success: false, error: "A system error occurred during upload" };
    }
}
