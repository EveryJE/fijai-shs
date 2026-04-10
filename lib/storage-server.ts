import { createAdminClient } from "@/utils/supabase/admin";

/**
 * Delete a file from institutional Supabase storage.
 * This is a Server-only utility.
 * @param bucket - The storage bucket name
 * @param path - The relative file path (not the full URL) to be removed
 */
export async function deleteStorageFile(
    bucket: string,
    path: string | null | undefined
): Promise<{ success: boolean; error?: string }> {
    if (!path) return { success: true };

    try {
        const supabase = createAdminClient();
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
