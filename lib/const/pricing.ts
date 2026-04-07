export const PAYSTACK_CONFIG = {
    transactionFeePercentage: 0.0195, // 1.95%
    transactionFeeCap: 200, // GHS 200 max per transaction
    bearer: "subaccount" as const, // organizer absorbs Paystack fee
    currency: "GHS",
} as const;

export const PLATFORM_FEES = {
    donation: { percentage: 0.035, fixed: 0 },
} as const;

export type FeeType = keyof typeof PLATFORM_FEES;

export function calculateServiceFee(amount: number, type: FeeType): number {
    const fee = PLATFORM_FEES[type];
    return Math.round((amount * fee.percentage + fee.fixed) * 100) / 100;
}
