"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatAmount } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { HeartHandshakeIcon, CreditCardIcon, ChevronLeft, ChevronRight, EyeIcon, UserCircle2Icon, WalletIcon, CameraIcon, MessageSquareQuoteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface Transaction {
    id: string;
    reference: string;
    donorName: string | null;
    donorEmail: string;
    amount: number | any;
    netAmount: number | any;
    fees: number | any;
    currency: string;
    status: string;
    paymentMethod: string;
    createdAt: string | Date;
    metadata?: any;
    digitalCard?: any;
    contactPerson?: any;
    event?: any;
    momentFileUrl?: string | null;
    momentCaption?: string | null;
}

interface RecentTransactionsTableProps {
    transactions: Transaction[];
}

export function RecentTransactionsTable({ transactions }: RecentTransactionsTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const itemsPerPage = 10;

    if (!transactions.length) return null;

    // Pagination Logic
    const totalPages = Math.ceil(transactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <Card className="border-none shadow-md bg-card overflow-hidden">
            <CardHeader className="pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <HeartHandshakeIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">Recent Contributions</CardTitle>
                            <CardDescription>Latest institutional fundraising activity</CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Donor Profile</TableHead>
                            <TableHead>Card Holder</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Allocation</TableHead>
                            <TableHead>Timing</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedTransactions.map((tx) => {
                            const cardHolderName = tx.metadata?.card_account_name || tx.metadata?.card_name || null;

                            return (
                                <TableRow
                                    key={tx.id}
                                    className="group hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => setSelectedTx(tx)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                                                <UserCircle2Icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm">
                                                    {tx.donorName || "Anonymous Alumnus"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {tx.donorEmail}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {cardHolderName ? (
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <CreditCardIcon className="h-3 w-3" />
                                                <span className="capitalize">{cardHolderName.toLowerCase()}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground/50 italic">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                      <span className="font-black text-emerald-600">
                                            {formatAmount(Number(tx.netAmount || tx.amount))}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold truncate max-w-[150px]">
                                                {tx.event?.title || "General Fund"}
                                            </span>
                                            {tx.digitalCard && (
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    Ref: {tx.digitalCard.cardCode}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <StatusBadge variant={tx.status} />
                                            <EyeIcon className="h-3.5 w-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
                        <p className="text-xs text-muted-foreground">
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, transactions.length)} of {transactions.length} entries
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-xs font-medium">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Donation Detail Dialog */}
            <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-primary p-6 text-primary-foreground relative">
                        <div className="flex items-center gap-2 opacity-60 text-[10px] font-black uppercase tracking-[3px] mb-2">
                            Transaction Insight
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <DialogTitle className="text-3xl font-black">{formatAmount(Number(selectedTx?.netAmount || selectedTx?.amount || 0))}</DialogTitle>
                                <DialogDescription className="text-primary-foreground/70 font-medium">
                                    Contribution by {selectedTx?.donorName || "Anonymous Alumni"}
                                </DialogDescription>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Reference</p>
                                <p className="font-mono text-sm leading-none mt-1">{selectedTx?.reference}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8 pt-0">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase  flex items-center gap-1.5">
                                    <UserCircle2Icon className="h-3 w-3" />
                                    Donor Contact
                                </p>
                                <p className="text-sm font-semibold">{selectedTx?.donorEmail}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase  flex items-center gap-1.5">
                                    <WalletIcon className="h-3 w-3" />
                                    Allocation
                                </p>
                                <p className="text-sm font-semibold truncate">{selectedTx?.event?.title || "General Fund"}</p>
                            </div>
                        </div>

                        {/* Shared Memory / Moment */}
                        {(selectedTx?.momentFileUrl || selectedTx?.momentCaption) ? (
                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center gap-2">
                                    <CameraIcon className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-black uppercase tracking-widest text-[#730303]">Shared Alumni Moment</h4>
                                </div>

                                <div className="bg-muted/30 rounded-2xl overflow-hidden border p-2">
                                    {selectedTx?.momentFileUrl && (
                                        <div className="aspect-video w-full relative rounded-xl overflow-hidden mb-3">
                                            <img
                                                src={selectedTx.momentFileUrl}
                                                alt="Donation Moment"
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    )}
                                    {selectedTx?.momentCaption && (
                                        <div className="p-4 flex gap-3 italic">
                                            <MessageSquareQuoteIcon className="h-5 w-5 text-primary/30 shrink-0" />
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                "{selectedTx.momentCaption}"
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
                </DialogContent>
            </Dialog>
        </Card>
    );
}
