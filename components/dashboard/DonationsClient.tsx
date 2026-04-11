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
    Loader2,
    DownloadCloudIcon,
    PrinterIcon,
    EyeIcon,
    UserCircle2Icon,
    CameraIcon,
    MessageSquareQuoteIcon
} from "lucide-react";
import { toast } from "sonner";
import { deleteManualDonation } from "@/lib/actions/donations";
import { useRouter } from "next/navigation";
import { ManualDonationSheet } from "./ManualDonationSheet";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

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
    userId: string | null;
    createdAt: string | Date;
    paidAt: string | Date | null;
    event?: { id: string; title: string } | null;
    donationItem?: { name: string } | null;
    contactPerson?: { name: string } | null;
    digitalCard?: { cardCode: string } | null;
    metadata?: any;
    momentFileUrl?: string | null;
    momentCaption?: string | null;
}

interface DonationsClientProps {
    paystackDonations: Donation[];
    manualDonations: Donation[];
    events: { id: string; title: string }[];
    currentUserId?: string;
}

export function DonationsClient({ paystackDonations, manualDonations, events, currentUserId }: DonationsClientProps) {
    const [activeTab, setActiveTab] = useState<"all" | "paystack" | "manual">("all");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
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

    function handleEdit(e: React.MouseEvent, donation: Donation) {
        e.stopPropagation();
        setSelectedDonation(donation);
        setSheetOpen(true);
    }

    function handleDelete(e: React.MouseEvent, id: string) {
        e.stopPropagation();
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

    function exportToCSV() {
        const headers = ["Reference", "Donor", "Email", "Amount", "Currency", "Event", "Method", "Status", "Date"];
        const rows = displayed.map(d => [
            d.reference,
            d.donorName || "Anonymous",
            d.donorEmail,
            d.amount,
            d.currency,
            d.event?.title || "General",
            d.paymentMethod,
            d.status,
            new Date(d.createdAt).toLocaleDateString()
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `donations_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Excel report exported successfully");
    }

    function handlePrint() {
        window.print();
    }

    const tabs = [
        { key: "all" as const, label: "All", count: allDonations.length },
        { key: "paystack" as const, label: "Online", count: paystackDonations.length, icon: WalletIcon },
        { key: "manual" as const, label: "Manual", count: manualDonations.length, icon: HandCoinsIcon },
    ];

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: auto; margin: 10mm; }
                    body { background: white !important; margin: 0 !important; padding: 0 !important; }

                    /* Hide Sidebars, Headers, Triggers, and Dialogs */
                    [data-slot="sidebar"], 
                    [data-slot="sidebar-trigger"],
                    header, 
                    nav, 
                    footer, 
                    .no-print, 
                    [data-slot="dialog"],
                    button, 
                    .actions-cell, 
                    .tab-bar, 
                    .actions-header { 
                        display: none !important; 
                    }

                    /* Reset SidebarInset and Layout Containers */
                    [data-slot="sidebar-inset"], 
                    main, 
                    .SidebarInset {
                        margin-left: 0 !important;
                        padding: 0 !important;
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                    }

                    .overflow-hidden, .overflow-x-auto, .max-h-[600px], .CardContent {
                        overflow: visible !important;
                        max-height: none !important;
                        display: block !important;
                        border: none !important;
                    }

                    .Card {
                        width: 100% !important;
                        border: none !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .print-header {
                        display: block !important;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #730303;
                        padding-bottom: 15px;
                    }

                    /* Summary Cards Layout */
                    .grid-cols-1, .grid-cols-3 {
                        display: flex !important;
                        flex-direction: row !important;
                        gap: 20px !important;
                        margin-bottom: 20px !important;
                    }

                    table { width: 100% !important; border-collapse: collapse !important; }
                    th, td { border: 1px solid #ddd !important; padding: 10px 8px !important; text-align: left !important; }
                    .StatusBadge { background: transparent !important; color: black !important; border: 1px solid #000 !important; }
                    .font-black, .font-bold { color: #000 !important; }
                }
                .print-header { display: none; }
            `}} />

            <div className="print-header">
                <h1 style={{ color: '#730303', margin: 0 }}>Fijai SHS Alumni Institutional Fund</h1>
                <p style={{ fontSize: '12px', margin: '4px 0' }}>Contribution Records — Generated on {new Date().toLocaleDateString()}</p>
            </div>

            <Card className="overflow-hidden no-print-border">
                <CardHeader className="pb-0 border-b">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Tabs */}
                        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg tab-bar">
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

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                             <div className="hidden md:flex items-center gap-1.5 border-r pr-4 mr-2 border-muted">
                                <Button variant="outline" size="sm" onClick={exportToCSV} className="h-8 text-[11px] font-bold uppercase tracking-wider">
                                    <DownloadCloudIcon className="h-3.5 w-3.5 mr-1" />
                                    Export Excel
                                </Button>
                                <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 text-[11px] font-bold uppercase tracking-wider">
                                    <PrinterIcon className="h-3.5 w-3.5 mr-1" />
                                    Print PDF
                                </Button>
                             </div>
                            <Button
                                size="sm"
                                onClick={() => { setSelectedDonation(null); setSheetOpen(true); }}
                                className="h-8 text-[11px] font-bold uppercase tracking-wider shadow-sm"
                            >
                                <PlusIcon className="h-3.5 w-3.5 mr-1" />
                                Add Manual Donation
                            </Button>
                        </div>
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
                                        <TableHead className="text-right w-[100px] actions-header">Actions</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayed.map((d) => (
                                    <TableRow 
                                        key={d.id} 
                                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                                        onClick={() => setSelectedDonation(d)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                 <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                                                     <UserCircle2Icon className="h-4 w-4" />
                                                 </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">
                                                        {d.donorName || "Anonymous"}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {d.donorEmail}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-black text-emerald-600">
                                                {formatAmount(Number(d.amount))}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-semibold truncate max-w-[150px] block opacity-70">
                                                {d.event?.title || "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border",
                                                d.paymentMethod === "paystack"
                                                    ? "bg-blue-50 text-blue-700 border-blue-100"
                                                    : "bg-amber-50 text-amber-700 border-amber-100"
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
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium">
                                                    {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                                                </span>
                                                {d.paidAt && (
                                                    <span className="text-[10px] text-muted-foreground opacity-60">
                                                        Settled: {new Date(d.paidAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        {(activeTab === "manual" || activeTab === "all") && (
                                            <TableCell className="text-right actions-cell">
                                                {d.paymentMethod === "manual" ? (
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {d.userId === currentUserId ? (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-xs"
                                                                    onClick={(e) => handleEdit(e, d)}
                                                                    className="h-7 w-7"
                                                                >
                                                                    <PencilIcon className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-xs"
                                                                    onClick={(e) => handleDelete(e, d.id)}
                                                                    disabled={deletingId === d.id}
                                                                    className="text-destructive hover:text-destructive h-7 w-7"
                                                                >
                                                                    {deletingId === d.id ? (
                                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                                    ) : (
                                                                        <Trash2Icon className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold text-muted-foreground/60 bg-muted/20 rounded border border-muted/10">
                                                                <EyeIcon className="h-2.5 w-2.5" />
                                                                Read Only
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                                        <Button variant="ghost" size="icon-xs" className="h-7 w-7 text-muted-foreground">
                                                            <EyeIcon className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
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
                donation={selectedDonation}
                events={events}
            />

            {/* Donation Detail / Memory Dialog */}
            <Dialog open={!!selectedDonation && !sheetOpen} onOpenChange={(open) => !open && setSelectedDonation(null)}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-primary p-6 text-primary-foreground relative">
                         <div className="flex items-center gap-2 opacity-60 text-[10px] font-black uppercase tracking-[3px] mb-2">
                             Institutional Record
                         </div>
                         <div className="flex justify-between items-end">
                             <div className="space-y-1">
                                <DialogTitle className="text-3xl font-black">{formatAmount(selectedDonation?.amount || 0)}</DialogTitle>
                                <DialogDescription className="text-primary-foreground/70 font-medium">
                                    Contribution by {selectedDonation?.donorName || "Anonymous Alumni"}
                                </DialogDescription>
                             </div>
                             <div className="text-right">
                                 <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Reference</p>
                                 <p className="font-mono text-sm leading-none mt-1">{selectedDonation?.reference}</p>
                             </div>
                         </div>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                             <div className="space-y-1">
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                     <UserCircle2Icon className="h-3 w-3" />
                                     Donor Contact
                                 </p>
                                 <p className="text-sm font-semibold">{selectedDonation?.donorEmail}</p>
                                 {selectedDonation?.phone && <p className="text-xs text-muted-foreground">{selectedDonation.phone}</p>}
                             </div>
                             <div className="space-y-1">
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                     <WalletIcon className="h-3 w-3" />
                                     Allocation
                                 </p>
                                 <p className="text-sm font-semibold truncate">{selectedDonation?.event?.title || "General Fund"}</p>
                                 <p className="text-[10px] text-muted-foreground uppercase font-bold">{selectedDonation?.paymentMethod} Payment</p>
                             </div>
                        </div>

                        {/* Shared Memory / Moment */}
                        {(selectedDonation?.momentFileUrl || selectedDonation?.momentCaption) ? (
                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center gap-2">
                                     <CameraIcon className="h-4 w-4 text-primary" />
                                     <h4 className="text-sm font-black uppercase tracking-widest text-[#730303]">Shared Alumni Moment</h4>
                                </div>
                                
                                <div className="bg-muted/30 rounded-2xl overflow-hidden border p-2">
                                    {selectedDonation?.momentFileUrl && (
                                        <div className="aspect-video w-full relative rounded-xl overflow-hidden mb-3">
                                            <img 
                                                src={selectedDonation.momentFileUrl} 
                                                alt="Donation Moment" 
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    )}
                                    {selectedDonation?.momentCaption && (
                                        <div className="p-4 flex gap-3 italic">
                                            <MessageSquareQuoteIcon className="h-5 w-5 text-primary/30 shrink-0" />
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                "{selectedDonation.momentCaption}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="pt-8 text-center opacity-30">
                                <p className="text-[10px] font-bold uppercase tracking-[4px]">No visual memory attached</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-muted/20 border-t flex justify-between items-center">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase">
                             Recorded {selectedDonation ? new Date(selectedDonation.createdAt).toLocaleString() : ""}
                         </span>
                         <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold" onClick={() => setSelectedDonation(null)}>
                             Close Record
                         </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
