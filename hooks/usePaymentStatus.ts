"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type PaymentStatus = "pending" | "processing" | "completed" | "failed";

export function usePaymentStatus(paymentId: string | null) {
  const [status, setStatus] = useState<PaymentStatus>("pending");

  useEffect(() => {
    if (!paymentId) return;

    const supabase = createClient();

    // Initial fetch
    supabase
      .from("payments")
      .select("status")
      .eq("id", paymentId)
      .single()
      .then(({ data }) => {
        if (data?.status) setStatus(data.status as PaymentStatus);
      });

    // Real-time subscription
    const channel = supabase
      .channel(`payment-${paymentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "payments",
          filter: `id=eq.${paymentId}`,
        },
        (payload) => {
          setStatus(payload.new.status as PaymentStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [paymentId]);

  return status;
}
