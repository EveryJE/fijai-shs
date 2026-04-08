"use client";

import { useEffect, useState } from "react";
import { fetchPaystackBanks } from "@/lib/dal/paystackBanks";
import { getCurrencyByCountryCode } from "@/lib/dal/countries";

interface PayoutAccountCardProps {
    paystackBankCode: string;
    paystackAccountNumber: string;
    paystackAccountName: string;
    /** ISO country code e.g. "GH", "NG" — defaults to "GH" */
    countryCode?: string;
    onEdit?: () => void;
}

export function PayoutAccountCard({
    paystackBankCode,
    paystackAccountNumber,
    paystackAccountName,
    countryCode = "GH",
    onEdit,
}: PayoutAccountCardProps) {
    const [bankName, setBankName] = useState<string>(paystackBankCode);
    const [isMomo, setIsMomo] = useState(false);

    useEffect(() => {
        async function resolveBankName() {
            const currency = getCurrencyByCountryCode(countryCode) || "GHS";
            try {
                const { banks, momo } = await fetchPaystackBanks(currency);
                const match = [...banks, ...momo].find((b) => b.code === paystackBankCode);
                if (match) {
                    setBankName(match.name);
                    setIsMomo(match.type === "mobile_money");
                }
            } catch {
                // fallback: keep the raw code as label
            }
        }
        resolveBankName();
    }, [paystackBankCode, countryCode]);

    // Mask: first 3 digits + •••• + last 4
    const maskedNumber =
        paystackAccountNumber.length > 7
            ? `${paystackAccountNumber.slice(0, 3)} •••• ${paystackAccountNumber.slice(-4)}`
            : paystackAccountNumber;

    return (
        <div
            className="relative w-full max-w-sm overflow-hidden select-none rounded-[12px] h-[200px] shadow-2xl border-2 border-[#ffd05033]"
        >
            {/* Background Gradient */}
            <div
                className={`absolute inset-0 ${
                    isMomo
                        ? "bg-gradient-to-br from-[#1a1a1a] via-[#3d2a00] to-[#1a1a1a]"
                        : "bg-gradient-to-br from-[#006400] via-[#1a1a1a] to-[#730303]"
                }`}
            />

            {/* Decorative Glow Circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#DAA520] opacity-10" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-[#DAA520] opacity-5" />

            {/* Institutional Stripe - Top */}
            <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-[#730303] via-[#DAA520] to-[#1B3A5C]" />

            {/* Institutional Stripe - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-[5px] bg-gradient-to-r from-[#1B3A5C] via-[#DAA520] to-[#730303]" />

            {/* Golden Metallic Chip */}
            <div className="absolute top-5 left-[22px] w-[46px] h-[34px] rounded-md bg-gradient-to-br from-[#c8a325] via-[#f5d96b] to-[#c8a325] shadow-lg flex items-center justify-center">
                <div className="w-9 h-6 rounded-sm border border-[#ffd05099] grid grid-cols-2 grid-rows-2 gap-px p-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-[#784f0033] rounded-sm" />
                    ))}
                </div>
            </div>

            {/* Network / Bank Badge */}
            <div className="absolute top-[22px] right-5">
                {isMomo ? (
                    <div className="flex items-center gap-1.5 bg-black/30 px-2 py-0.5 rounded-full border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-[#DAA520] animate-pulse" />
                        <span className="text-[10px] text-white font-mono tracking-[1px] uppercase">
                           Momo
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center">
                        <div className="w-[22px] h-[22px] rounded-full bg-[#cc0000] opacity-90 border border-white/20" />
                        <div className="w-[22px] h-[22px] rounded-full bg-[#dd9900] opacity-75 -ml-2 border border-white/20" />
                    </div>
                )}
            </div>

            {/* Account Number */}
            <div className="absolute top-[70px] left-[22px] right-[22px]">
                <p className="text-[9px] text-white/50 tracking-[3px] uppercase mb-1 font-bold">
                    ACCOUNT NUMBER
                </p>
                <p className="text-[20px] font-black text-white/90 tracking-[5px] font-mono drop-shadow-md">
                    {maskedNumber}
                </p>
            </div>

            {/* Account Name + Bank/Network */}
            <div className="absolute bottom-4 left-[22px] right-[22px] flex justify-between items-end">
                <div className="max-w-[60%]">
                    <p className="text-[8px] text-white/40 tracking-[2px] uppercase mb-0.5 font-bold">
                        ACCOUNT NAME
                    </p>
                    <p className="text-[12px] text-white font-black tracking-[1px] truncate uppercase">
                        {paystackAccountName}
                    </p>
                </div>

                <div className="text-right max-w-[40%]">
                    <p className="text-[8px] text-white/40 tracking-[2px] uppercase mb-0.5 font-bold">
                        {isMomo ? "NETWORK" : "BANK"}
                    </p>
                    <p className="text-[11px] text-[#DAA520] font-black tracking-wider truncate uppercase">
                        {bankName}
                    </p>
                </div>
            </div>

            {onEdit && (
                <button
                    onClick={onEdit}
                    className="absolute bottom-0 left-0 right-0 bg-transparent border-t border-white/5 py-1.5 px-4 text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200 text-[10px] tracking-widest uppercase flex items-center justify-center gap-1.5"
                >
                    Update details →
                </button>
            )}
        </div>
    );
}
