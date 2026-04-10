"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatAmount, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
    WalletIcon,
    HandCoinsIcon,
    PlusIcon,
    PencilIcon,
    Trash2Icon,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { deleteManualDonation } from "@/lib/actions/donations";
import { useRouter } from "next/navigation";
import { ManualDonationSheet } from "./ManualDonationSheet";

interface Donation {
    id: string;
    reference: string;
    donorName: string | null;
    donorEmail: string;
    phone: string | null;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    createdAt: string | Date;
    paidAt: string | Date | null;
    event?: { id: string; title: string } | null;
    donationItem?: { name: string } | null;
    contactPerson?: { name: string } | null;
    digitalCard?: { cardCode: string } | null;
    metadata?: any;
    momentCaption?: string | null;
}

interface DonationsClientProps {
    paystackDonations: Donation[];
    manualDonations: Donation[];
    events: { id: string; title: string }[];
}

export function DonationsClient({ paystackDonations, manualDonations, events }: DonationsClientProps) {
    const [activeTab, setActiveTab] = useState<"all" | "paystack" | "manual">("all");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const allDonations = [...paystackDonations, ...manualDonations].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const displayed = activeTab === "paystack"
        ? paystackDonations
        : activeTab === "manual"
            ? manualDonations
            : allDonations;

    function handleEdit(donation: Donation) {
        setEditingDonation(donation);
        setSheetOpen(true);
    }

    function handleDelete(id: string) {
        if (!confirm("Delete this donation? This cannot be undone.")) return;
        setDeletingId(id);
        startTransition(async () => {
            try {
                await deleteManualDonation(id);
                toast.success("Donation deleted");
                router.refresh();
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Delete failed");
            } finally {
                setDeletingId(null);
            }
        });
    }

    const tabs = [
        { key: "all" as const, label: "All", count: allDonations.length },
        { key: "paystack" as const, label: "Online", count: paystackDonations.length, icon: WalletIcon },
        { key: "manual" as const, label: "Manual", count: manualDonations.length, icon: HandCoinsIcon },
    ];

    return (
        <>
            <Card className=" overflow-hidden">
                <CardHeader className="pb-0 border-b">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Tabs */}
                        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                                        activeTab === tab.key
                                            ? "bg-background shadow-sm text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {tab.icon && <tab.icon className="h-3 w-3" />}
                                    {tab.label}
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded-full",
                                        activeTab === tab.key
                                            ? "bg-primary/10 text-primary"
                                            : "bg-muted text-muted-foreground"
                                    )}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Add Manual Donation button */}
                        <Button
                            size="sm"
                            onClick={() => { setEditingDonation(null); setSheetOpen(true); }}
                            className="gap-1.5"
                        >
                            <PlusIcon className="h-3.5 w-3.5" />
                            Add Manual Donation
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {displayed.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <HandCoinsIcon className="h-8 w-8 mb-3 opacity-30" />
                            <p className="text-sm font-medium">No donations found</p>
                            <p className="text-xs mt-1">
                                {activeTab === "manual"
                                    ? "Click 'Add Manual Donation' to record a cash contribution."
                                    : "Donations will appear here after payments are processed."}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead>Donor</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    {(activeTab === "manual" || activeTab === "all") && (
                                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayed.map((d) => (
                                    <TableRow key={d.id} className="hover:bg-muted/20 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">
                                                    {d.donorName || "Anonymous"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {d.donorEmail}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-emerald-600">
                                                {formatAmount(Number(d.amount))}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-medium truncate max-w-[150px] block">
                                                {d.event?.title || "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
                                                d.paymentMethod === "paystack"
                                                    ? "bg-blue-50 text-blue-600 border-blue-100"
                                                    : "bg-amber-50 text-amber-600 border-amber-100"
                                            )}>
                                                {d.paymentMethod === "paystack" ? (
                                                    <><WalletIcon className="h-3 w-3" /> Online</>
                                                ) : (
                                                    <><HandCoinsIcon className="h-3 w-3" /> Manual</>
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={d.status} size="sm" />
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                                            </span>
                                        </TableCell>
                                        {(activeTab === "manual" || activeTab === "all") && (
                                            <TableCell className="text-right">
                                                {d.paymentMethod === "manual" ? (
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            onClick={() => handleEdit(d)}
                                                        >
                                                            <PencilIcon className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            onClick={() => handleDelete(d.id)}
                                                            disabled={deletingId === d.id}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            {deletingId === d.id ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <Trash2Icon className="h-3 w-3" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground/40">—</span>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ManualDonationSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                donation={editingDonation}
                events={events}
            />
        </>
    );
}
