"use client";
import { useSupabaseRecoveryRedirect } from "@/lib/hooks/useSupabaseRecoveryRedirect";

export function SupabaseRecoveryRedirector() {
  useSupabaseRecoveryRedirect();
  return null;
}
