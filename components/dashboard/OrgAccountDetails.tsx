"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Banknote, LandmarkIcon, Building2Icon, WalletIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { supportedCountries, getCurrencyByCountryCode } from "@/lib/dal/countries";
import { fetchPaystackBanks, type PaystackBank } from "@/lib/dal/paystackBanks";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { savePayoutAccount } from "@/lib/actions/org";
import { PayoutAccountCard } from "@/components/dashboard/PayoutAccountCard";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface OrgAccountDetailsProps {
    readonly organization: any;
    readonly userRoles?: string[];
}

export function OrgAccountDetails({ organization, userRoles = [] }: OrgAccountDetailsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isAdmin = userRoles.includes("admin");

    // Determine initial bank type based on existing account
    const getInitialBankType = () => {
        if (organization?.bankCode) {
            const isMomo = ["MTN", "VOD", "ATL", "AIR"].some(m => organization.bankCode?.includes(m));
            return isMomo ? "momo" : "bank";
        }
        return "momo";
    };

    const [bankType, setBankType] = useState<"momo" | "bank">(getInitialBankType());
    const [country, setCountry] = useState("GH");

    // Local payout state for reactivity - shows current saved account
    const [payoutBankCode, setPayoutBankCode] = useState(organization?.bankCode ?? "");
    const [payoutAccountNumber, setPayoutAccountNumber] = useState(organization?.accountNumber ?? "");
    const [payoutAccountName, setPayoutAccountName] = useState(organization?.accountName ?? "");

    // Form state - always empty for new entry
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

            const currency = getCurrencyByCountryCode(country) || "GHS";
            try {
                const { banks: fetchedBanks, momo: fetchedMomo } = await fetchPaystackBanks(currency);
                setBanks(fetchedBanks);
                setMomoNetworks(fetchedMomo);

                // Pre-fill if org has existing data
                if (payoutBankCode || payoutAccountNumber) {
                    const allNetworks = [...fetchedBanks, ...fetchedMomo];

                    if (payoutBankCode) {
                        const matched = allNetworks.find(n => n.code === payoutBankCode);
                        if (matched) {
                            setBankCode(payoutBankCode);
                        }
                    }

                    if (payoutAccountNumber) {
                        setAccountNumber(payoutAccountNumber);
                    }
                }
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

    // Separate effect to pre-fill when payout data changes after initial load
    useEffect(() => {
        if (payoutAccountNumber && !accountNumber) {
            setAccountNumber(payoutAccountNumber);
        }
        if (payoutAccountName && !verifiedName) {
            setVerifiedName(payoutAccountName);
        }
    }, [payoutAccountNumber, payoutAccountName]);

    async function handleVerify() {
        if (!accountNumber || !bankCode) {
            toast.error("Please enter both account number and select a provider.");
            return;
        }

        setIsVerifying(true);
        setVerifiedName(null);

        try {
            console.log("Verifying account:", { accountNumber, bankCode });

            const { data, error } = await supabase.functions.invoke("verify-account", {
                body: JSON.stringify({ accountNumber, bankCode }),
            });

            console.log("Verify response:", { data, error });

            if (error || !data?.success) {
                toast.error(data?.error || "Verification failed. Check your details.");
                return;
            }

            setVerifiedName(data.accountName);
            toast.success("Account verified successfully.");
        } catch (err) {
            console.error("Verify error:", err);
            toast.error("Failed to verify account.");
        } finally {
            setIsVerifying(false);
        }
    }

    async function handleSave() {
        if (!accountNumber || !bankCode || !verifiedName) return;

        const selectedBank = [...banks, ...momoNetworks].find(b => b.code === bankCode);

        startTransition(async () => {
            try {
                // Create/update Paystack subaccount via edge function
                const { data, error } = await supabase.functions.invoke("save-account", {
                    body: {
                        organizationId: organization?.id || "singleton-org",
                        accountNumber,
                        bankCode,
                        bankName: selectedBank?.name || "",
                        accountName: verifiedName,
                        userRoles
                    }
                });

                if (error || !data?.success) {
                    toast.error(data?.error || error?.message || "Failed to setup payout account.");
                    return;
                }

                // Save to database via server action
                await savePayoutAccount(
                    organization?.id || "singleton-org",
                    bankCode,
                    selectedBank?.name || "",
                    accountNumber,
                    verifiedName,
                    data.subaccountCode,
                    ""
                );

                setPayoutBankCode(bankCode);
                setPayoutAccountNumber(accountNumber);
                setPayoutAccountName(verifiedName);

                setBankCode("");
                setAccountNumber("");
                setVerifiedName(null);

                toast.success("Payout account saved successfully!");

                // Close modal and refresh server data
                setIsModalOpen(false);
                router.refresh();
            } catch {
                toast.error("An error occurred while saving.");
            }
        });
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
            <Card className="border-none bg-white overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Banknote className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold ">Financial Payout Setup</CardTitle>
                                <CardDescription className="text-sm font-medium">Link a verified account to receive institutional funding.</CardDescription>
                            </div>
                        </div>
                        {(isAdmin && payoutAccountNumber && payoutAccountName && payoutBankCode) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Pencil className="h-4 w-4" />
                                Edit
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    {payoutAccountNumber && payoutAccountName && payoutBankCode ? (
                        <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-2xl border-2 border-dashed border-muted-foreground/10 space-y-4">
                            <p className="text-[10px]   tracking-[3px] text-muted-foreground/60 mb-2">Current Active Account</p>
                            <PayoutAccountCard
                                paystackBankCode={payoutBankCode}
                                paystackAccountNumber={payoutAccountNumber}
                                paystackAccountName={payoutAccountName}
                                countryCode={country}
                            />
                        </div>
                    ) : isAdmin ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">No payout account configured yet.</p>
                            <Button onClick={() => setIsModalOpen(true)}>
                                <LandmarkIcon className="mr-2 h-4 w-4" />
                                Add Payout Account
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No payout account configured. Contact an admin to set this up.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sheet for adding/editing payout account */}
            <Sheet open={isModalOpen} onOpenChange={setIsModalOpen} modal={false}>
                <SheetContent className="w-full sm:max-w-xl overflow-y-auto font-">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-xl font-semibold">
                            {payoutAccountNumber ? "Update Payout Account" : "Add Payout Account"}
                        </SheetTitle>
                    </SheetHeader>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b">
                                <div className="space-y-1">
                                    <Label className="">Payout Type</Label>
                                    <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit mt-1">
                                        <button
                                            type="button"
                                            onClick={() => { setBankType("momo"); setBankCode(payoutBankCode || ""); setAccountNumber(payoutAccountNumber || ""); setVerifiedName(null); }}
                                            className={cn("px-6 py-1 text-sm rounded text-nowrap transition-all", bankType === "momo" ? "bg-white shadow-sm text-primary" : "text-muted-foreground/60 hover:text-muted-foreground")}
                                        >
                                            Mobile Money
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setBankType("bank"); setBankCode(payoutBankCode || ""); setAccountNumber(payoutAccountNumber || ""); setVerifiedName(null); }}
                                            className={cn("px-6 py-1 text-sm rounded text-nowrap transition-all", bankType === "bank" ? "bg-white shadow-sm text-primary" : "text-muted-foreground/60 hover:text-muted-foreground")}
                                        >
                                            Bank Account
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1 min-w-[200px]">
                                    <Label className="   text-[#730303]">Payout Country</Label>
                                    <Select
                                        value={country}
                                        onValueChange={(value) => setCountry(value || "GH")}
                                        disabled={isLoadingNetworks}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countryOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-8 sm:grid-cols-2">
                                <div className="space-y-2 group">
                                    <Label className=" transition-colors">
                                        {bankType === "momo" ? "Network Provider" : "Financial Institution"}
                                    </Label>
                                    <Select
                                        value={bankCode}
                                        onValueChange={(value) => setBankCode(value || "")}
                                        disabled={isLoadingNetworks}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Network Provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {networkOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 group">
                                    <Label className="text-xs  transition-colors">
                                        Recipient Account Number
                                    </Label>
                                    <Input
                                        value={accountNumber}
                                        onChange={(e) => {
                                            setAccountNumber(e.target.value.replace(/\D/g, ""));
                                            setVerifiedName(null);
                                        }}
                                        placeholder={accountNumber ? accountNumber : bankType === "momo" ? "e.g. 024XXXXXXX" : "Enter account number"}
                                        className="h-9"
                                    />

                                    {verifiedName && (
                                        <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 animate-in zoom-in-95 fill-mode-both">
                                            <Check className="h-4 w-4 shrink-0" />
                                            <span className="text-[11px]   ">Verified: {verifiedName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 mt-6 border-t">
                        {!verifiedName ? (
                            <Button
                                type="button"
                                onClick={handleVerify}
                                disabled={isVerifying || !accountNumber || !bankCode}
                                className=" px-8 tracking-[2px] shadow-xl shadow-primary/10"
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
                                className=" px-8 tracking-[2px]"
                            >
                                {isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                Link Verified Account
                            </Button>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
