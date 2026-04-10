"use client";

import PaystackPop from "@paystack/inline-js";
import { useCallback, useState } from "react";

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

interface PaystackOptions {
    onSuccess?: (tx: PaystackResult) => void;
    onCancel?: () => void;
    phone?: string;
}

export function usePaystack() {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";

    const resumeTransaction = useCallback(
        (accessCode: string, options?: PaystackOptions) => {
            if (typeof window === "undefined") {
                throw new Error("Paystack can only be used in the browser.");
            }

            if (!publicKey) {
                throw new Error("Paystack public key is not configured.");
            }

            const paystack = new PaystackPop();
            paystack.newTransaction({
                key: publicKey,
                email: "",
                amount: 0,
                accessCode,
                phone: options?.phone,
                onSuccess: (tx: PaystackResult) => {
                    options?.onSuccess?.(tx);
                },
                onCancel: () => {
                    options?.onCancel?.();
                },
            });
        },
        [publicKey],
    );

    const initiateDonation = useCallback(
        async (payload: DonationPayload, callbacks?: PaystackOptions) => {
            setLoading(true);
            try {
                // Call edge function to initialise payment & create pending record
                const { data, error } = await supabase.functions.invoke(
                    "initiate-payment",
                    { body: payload },
                );

                if (error || !data?.accessCode) {
                    throw new Error(
                        error?.message ?? data?.error ?? "Failed to initiate payment",
                    );
                }

                resumeTransaction(data.accessCode, {
                    phone: callbacks?.phone ?? payload.phone,
                    onSuccess: callbacks?.onSuccess,
                    onCancel: callbacks?.onCancel,
                });

                return { donationId: data.donationId, reference: data.reference };
            } finally {
                setLoading(false);
            }
        },
        [resumeTransaction, supabase],
    );

    return { initiateDonation, resumeTransaction, loading };
}
