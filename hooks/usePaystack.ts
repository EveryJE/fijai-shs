"use client";

import { useState, useCallback } from "react";
import PaystackPop from "@paystack/inline-js";
import { createClient } from "@/utils/supabase/client";

interface DonationPayload {
    email: string;
    amount: number;
    donorName?: string;
    phone?: string;
    currency?: string;
    eventId: string;
    contactPersonId?: string;
    digitalCardId?: string;
    donationItemId?: string;
    momentFileUrl?: string;
    momentCaption?: string;
    metadata?: Record<string, unknown>;
}

interface PaystackResult {
    reference: string;
    status: string;
}

export function usePaystack() {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const initiateDonation = useCallback(
        async (
            payload: DonationPayload,
            callbacks?: {
                onSuccess?: (tx: PaystackResult) => void;
                onCancel?: () => void;
            }
        ) => {
            setLoading(true);
            try {
                // Call edge function to initialise payment & create pending record
                const { data, error } = await supabase.functions.invoke(
                    "initiate-payment",
                    { body: payload }
                );

                if (error || !data?.accessCode) {
                    throw new Error(
                        error?.message ?? data?.error ?? "Failed to initiate payment"
                    );
                }

                // Open Paystack popup using the server-generated access code
                const paystack = new PaystackPop();
                paystack.newTransaction({
                    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
                    email: payload.email,
                    amount: 0,
                    accessCode: data.accessCode,
                    onSuccess: (tx: PaystackResult) => {
                        callbacks?.onSuccess?.(tx);
                    },
                    onCancel: () => {
                        callbacks?.onCancel?.();
                    },
                });

                return { donationId: data.donationId, reference: data.reference };
            } finally {
                setLoading(false);
            }
        },
        [supabase]
    );

    return { initiateDonation, loading };
}
