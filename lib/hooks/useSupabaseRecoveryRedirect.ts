"use client";
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
      const isRecovery = params.get("type") === "recovery" && params.get("access_token");
      const isError = params.get("error") || params.get("error_description");

      if (isRecovery || isError) {
        // Build query string for reset-password page
        const queryParams: Record<string, string> = {};
        
        params.forEach((value, key) => {
          queryParams[key] = value;
        });

        const query = new URLSearchParams(queryParams).toString();
        router.replace(`${resetPath}?${query}`);
      }
    }
  }, [router, resetPath]);
}
