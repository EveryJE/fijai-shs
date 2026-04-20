import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirects to the reset-password page if a Supabase recovery token is present in the URL hash.
 * Moves the token and type to query params for the reset-password page.
 */
export function useSupabaseRecoveryRedirect(resetPath = "/auth/reset-password") {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.substring(1); // Remove '#'
      const params = new URLSearchParams(hash);
      if (params.get("type") === "recovery" && params.get("access_token")) {
        // Build query string for reset-password page
        const query = new URLSearchParams({
          access_token: params.get("access_token")!,
          type: params.get("type")!,
          refresh_token: params.get("refresh_token") || "",
          expires_in: params.get("expires_in") || "",
          expires_at: params.get("expires_at") || ""
        }).toString();
        router.replace(`${resetPath}?${query}`);
      }
    }
  }, [router, resetPath]);
}
