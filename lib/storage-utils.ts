import { createClient } from "@/utils/supabase/server";

/**
 * Storage bucket names used in the Fijai institutional platform.
 */
export const STORAGE_BUCKETS = {
    AVATARS: "avatars",
    EVENTS: "events",
    ORGANIZATIONS: "organizations",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

/**
 * Extract the storage path from a full Supabase public URL.
 * This is critical for moving away from monolithic URLs to path-based storage references.
 * @param fullUrl - The complete public URL from Supabase
 * @param bucket - The storage bucket name
 * @returns The extracted relative storage path, or null if extraction fails
 */
export function extractPathFromUrl(fullUrl: string | null | undefined, bucket: StorageBucket): string | null {
    if (!fullUrl) return null;

    try {
        // Pattern matches the standard Supabase storage structure: /storage/v1/object/public/{bucket}/{path}
        const pattern = new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`);
        const match = pattern.exec(fullUrl);

        if (match?.[1]) {
            return decodeURIComponent(match[1]);
        }

        // Return as-is if it's already a relative path rather than a full protocol-based URL
        if (!fullUrl.startsWith("http") && !fullUrl.startsWith("/storage")) {
            return fullUrl;
        }

        return null;
    } catch (error) {
        console.error({ fullUrl, bucket, error }, "Error extracting institutional storage path from URL");
        return null;
    }
}

/**
 * Generate a complete public URL from a relative storage path synchronously.
 * Relies on the NEXT_PUBLIC_SUPABASE_URL environment variable for zero-latency URL resolution.
 * @param bucket - The storage bucket name
 * @param path - The relative file path within the bucket
 * @returns The complete public access URL
 */
export function getPublicUrlSync(bucket: StorageBucket, path: string | null | undefined): string | null {
    if (!path) return null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Delete a file from institutional Supabase storage.
 * @param bucket - The storage bucket name
 * @param path - The relative file path (not the full URL) to be removed
 */
export async function deleteStorageFile(
    bucket: string,
    path: string | null | undefined
): Promise<{ success: boolean; error?: string }> {
    if (!path) return { success: true };

    try {
        const supabase = await createClient();
        const { error } = await supabase.storage.from(bucket).remove([path]);

        if (error) {
            console.error({ bucket, path, error: error.message }, "Institutional storage removal failed");
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error({ bucket, path, error: errorMessage }, "Exception during storage cleanup");
        return { success: false, error: errorMessage };
    }
}

/**
 * Normalize an input (either a full URL or a relative path) to just the storage path.
 */
export function normalizeToPath(pathOrUrl: string | null | undefined, bucket: StorageBucket): string | null {
    if (!pathOrUrl) return null;
    
    const isFullUrl = pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://");
    if (isFullUrl) {
        return extractPathFromUrl(pathOrUrl, bucket);
    }

    return pathOrUrl;
}
