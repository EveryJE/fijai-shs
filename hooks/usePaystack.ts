"use client";

import { useCallback } from "react";
import PaystackPop from "@paystack/inline-js";

interface TransactionOptions {
  reference?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
  onSuccess?: (transaction: { reference: string; status: string }) => void;
  onCancel?: () => void;
}

interface ResumeOptions {
  phone?: string;
  onSuccess?: (transaction: { reference: string; status: string }) => void;
  onCancel?: () => void;
}

export function usePaystack() {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  const startTransaction = useCallback(
    (email: string, amount: number, options?: TransactionOptions) => {
      if (!publicKey) {
        console.error("Paystack public key not configured");
        return;
      }

      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: publicKey,
        email,
        amount: amount * 100, // Convert to pesewas/kobo
        currency: options?.currency ?? "GHS",
        ref: options?.reference,
        metadata: options?.metadata,
        onSuccess: (transaction) => {
          options?.onSuccess?.(transaction);
        },
        onCancel: () => {
          options?.onCancel?.();
        },
      });
    },
    [publicKey]
  );

  const resumeTransaction = useCallback(
    (accessCode: string, options?: ResumeOptions) => {
      if (!publicKey) {
        console.error("Paystack public key not configured");
        return;
      }

      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: publicKey,
        email: "",
        amount: 0,
        accessCode,
        phone: options?.phone,
        onSuccess: (transaction) => {
          options?.onSuccess?.(transaction);
        },
        onCancel: () => {
          options?.onCancel?.();
        },
      });
    },
    [publicKey]
  );

  return { startTransaction, resumeTransaction, isConfigured: !!publicKey };
}
