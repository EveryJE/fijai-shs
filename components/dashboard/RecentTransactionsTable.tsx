"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatAmount } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { HeartHandshakeIcon, CreditCardIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Transaction {
    id: string;
    donorName: string | null;
    donorEmail: string;
    amount: number | any;
    currency: string;
    status: string;
    createdAt: string | Date;
    metadata?: any;
    digitalCard?: any;
    contactPerson?: any;
    event?: any;
}

interface RecentTransactionsTableProps {
    transactions: Transaction[];
}

export function RecentTransactionsTable({ transactions }: RecentTransactionsTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
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
                                <TableRow key={tx.id} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border shadow-sm">
                                                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                                    {(tx.donorName || tx.donorEmail || "A").charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
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
                                        <span className="font-bold text-emerald-600">
                                            {formatAmount(Number(tx.amount))}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium truncate max-w-[150px]">
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
                                        <StatusBadge variant={tx.status} />
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
        </Card>
    );
}
