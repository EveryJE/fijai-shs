"use client";

import { useState, useTransition, useEffect } from "react";
import { Check, Loader2, Banknote, LandmarkIcon, Building2Icon, WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { supportedCountries, getCurrencyByCountryCode } from "@/lib/dal/countries";
import { fetchPaystackBanks, type PaystackBank } from "@/lib/dal/paystackBanks";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { PayoutAccountCard } from "@/components/dashboard/PayoutAccountCard";
import { cn } from "@/lib/utils";

interface OrgAccountDetailsProps {
    readonly organization: any;
}

export function OrgAccountDetails({ organization }: OrgAccountDetailsProps) {
    const [isPending, startTransition] = useTransition();
    const [bankType, setBankType] = useState<"momo" | "bank">("momo");
    const [country, setCountry] = useState("GH");

    // Local payout state for reactivity
    const [payoutBankCode, setPayoutBankCode] = useState(organization?.bankCode ?? "");
    const [payoutAccountNumber, setPayoutAccountNumber] = useState(organization?.accountNumber ?? "");
    const [payoutAccountName, setPayoutAccountName] = useState(organization?.accountName ?? "");

    // Form state
    const [bankCode, setBankCode] = useState("");
    const [accountNumber, setAccountNumber] = useState("");

    // Verification state
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifiedName, setVerifiedName] = useState<string | null>(null);

    // Lists
    const [banks, setBanks] = useState<PaystackBank[]>([]);
    const [momoNetworks, setMomoNetworks] = useState<PaystackBank[]>([]);
    const [isLoadingNetworks, setIsLoadingNetworks] = useState(false);

    const supabase = createClient();

    // Options for Combobox
    const networks = bankType === "momo" ? momoNetworks : banks;
    const countryOptions = supportedCountries.map((c) => ({ value: c.code, label: c.name }));
    const networkOptions = networks.map((n) => ({ value: n.code, label: n.name }));

    useEffect(() => {
        async function loadNetworks() {
            setIsLoadingNetworks(true);
            setBankCode("");

            const currency = getCurrencyByCountryCode(country) || "GHS";
            try {
                const { banks: fetchedBanks, momo: fetchedMomo } = await fetchPaystackBanks(currency);
                setBanks(fetchedBanks);
                setMomoNetworks(fetchedMomo);
            } catch {
                setBanks([]);
                setMomoNetworks([]);
                toast.error("Failed to load providers. Please try again.");
            } finally {
                setIsLoadingNetworks(false);
            }
        }

        loadNetworks();
    }, [country]);

    async function handleVerify() {
        if (!accountNumber || !bankCode) {
            toast.error("Please enter both account number and select a provider.");
            return;
        }

        setIsVerifying(true);
        setVerifiedName(null);

        try {
            const { data, error } = await supabase.functions.invoke("verify-account", {
                body: { accountNumber, bankCode },
            });

            if (error || !data?.success) {
                toast.error(data?.error || "Verification failed. Check your details.");
                return;
            }

            setVerifiedName(data.accountName);
            toast.success("Account verified successfully.");
        } catch {
            toast.error("Failed to verify account.");
        } finally {
            setIsVerifying(false);
        }
    }

    async function handleSave() {
        if (!accountNumber || !bankCode || !verifiedName) return;

        startTransition(async () => {
            try {
                const selectedBank = [...banks, ...momoNetworks].find(b => b.code === bankCode);
                
                const { data, error } = await supabase.functions.invoke("save-account", {
                    body: {
                        organizationId: organization?.id || null,
                        accountNumber,
                        bankCode,
                        bankName: selectedBank?.name || "",
                        accountName: verifiedName,
                        currency: "GHS"
                    }
                });

                if (error || !data?.success) {
                    toast.error(data?.error || "Failed to setup transaction account.");
                    return;
                }

                setPayoutBankCode(bankCode);
                setPayoutAccountNumber(accountNumber);
                setPayoutAccountName(verifiedName);
                
                setBankCode("");
                setAccountNumber("");
                setVerifiedName(null);

                toast.success("Payout account saved successfully!");
                window.location.reload();
            } catch {
                toast.error("An error occurred while saving the account.");
            }
        });
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Banknote className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold tracking-tight">Financial Payout Setup</CardTitle>
                            <CardDescription className="text-sm font-medium">Link a verified account to receive institutional funding.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                    
                    {payoutAccountNumber && payoutAccountName && payoutBankCode && (
                        <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-2xl border-2 border-dashed border-muted-foreground/10 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[3px] text-muted-foreground/60 mb-2">Current Active Account</p>
                            <PayoutAccountCard
                                paystackBankCode={payoutBankCode}
                                paystackAccountNumber={payoutAccountNumber}
                                paystackAccountName={payoutAccountName}
                                countryCode={country}
                            />
                        </div>
                    )}

                    <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b">
                             <div className="space-y-1">
                                <Label className="text-xs font-black uppercase tracking-widest text-[#730303]">Payout Type</Label>
                                <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit mt-1">
                                    <button
                                        type="button"
                                        onClick={() => { setBankType("momo"); setVerifiedName(null); }}
                                        className={cn("px-6 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all", bankType === "momo" ? "bg-white shadow-sm text-primary" : "text-muted-foreground/60 hover:text-muted-foreground")}
                                    >
                                        Mobile Money
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setBankType("bank"); setVerifiedName(null); }}
                                        className={cn("px-6 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all", bankType === "bank" ? "bg-white shadow-sm text-primary" : "text-muted-foreground/60 hover:text-muted-foreground")}
                                    >
                                        Bank Account
                                    </button>
                                </div>
                             </div>

                             <div className="space-y-1 min-w-[200px]">
                                <Label className="text-xs font-black uppercase tracking-widest text-[#730303]">Payout Country</Label>
                                <Combobox
                                    options={countryOptions}
                                    value={country}
                                    onChange={(val) => setCountry(val)}
                                    placeholder="Select country"
                                    disabled={isLoadingNetworks}
                                    className="mt-1 font-bold h-11"
                                />
                             </div>
                        </div>

                        <div className="grid gap-8 sm:grid-cols-2">
                            <div className="space-y-2 group">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 group-focus-within:text-primary transition-colors">
                                    {bankType === "momo" ? "Network Provider" : "Financial Institution"}
                                </Label>
                                <Combobox
                                    options={networkOptions}
                                    value={bankCode}
                                    onChange={(val) => { setBankCode(val); setVerifiedName(null); }}
                                    disabled={isLoadingNetworks}
                                    placeholder={isLoadingNetworks ? "Loading..." : `Select ${bankType === "momo" ? "network" : "bank"}`}
                                    className="h-12 border-2 focus-visible:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2 group">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 group-focus-within:text-primary transition-colors">
                                    Recipient Account Number
                                </Label>
                                <Input
                                    value={accountNumber}
                                    onChange={(e) => {
                                        setAccountNumber(e.target.value.replace(/\D/g, ""));
                                        setVerifiedName(null);
                                    }}
                                    placeholder={bankType === "momo" ? "e.g. 024XXXXXXX" : "Enter account number"}
                                    className="h-12 border-2 text-lg font-mono tracking-widest focus-visible:ring-primary/20"
                                />

                                {verifiedName && (
                                    <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 animate-in zoom-in-95 fill-mode-both">
                                        <Check className="h-4 w-4 shrink-0" />
                                        <span className="text-[11px] font-black uppercase tracking-wider">Verified: {verifiedName}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-4 border-t px-8 py-6 bg-muted/10">
                    {!verifiedName ? (
                        <Button
                            type="button"
                            onClick={handleVerify}
                            disabled={isVerifying || !accountNumber || !bankCode}
                            className="h-12 px-8 font-black uppercase tracking-[2px] shadow-xl shadow-primary/10"
                        >
                            {isVerifying ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <LandmarkIcon className="mr-2 h-4 w-4" />
                            )}
                            Perform Verification
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={isPending}
                            className="h-12 px-8 font-black uppercase tracking-[2px] bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20"
                        >
                            {isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="mr-2 h-4 w-4" />
                            )}
                            Link Verified Account
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-md bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                             <WalletIcon className="h-4 w-4" />
                             Platform Fee Structure
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Every donation made through the platform is processed with a <strong>0% platform commission</strong>. The school receives 100% of the funds directly into this verified account, after standard merchant processing fees from Paystack.
                        </p>
                    </CardContent>
                </Card>
                
                <Card className="border-none shadow-md bg-secondary/5">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-[#DAA520] flex items-center gap-2">
                             <Building2Icon className="h-4 w-4" />
                             Automatic Routing
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Linking a verified account enables automatic reconciliation and routing of funds. Your institutional dashboard will update in real-time as soon as donations are confirmed by the banking provider.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
