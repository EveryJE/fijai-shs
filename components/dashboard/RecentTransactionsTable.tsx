"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatAmount } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { CreditCardIcon, UserCheckIcon, LandmarkIcon, HeartHandshakeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
    id: string;
    donorName: string | null;
    donorEmail: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: Date;
    digitalCard?: any;
    contactPerson?: any;
    event?: any;
}

interface RecentTransactionsTableProps {
    transactions: Transaction[];
}

export function RecentTransactionsTable({ transactions }: RecentTransactionsTableProps) {
    if (!transactions.length) return null;

    return (
        <Card className="border-none shadow-xl bg-white overflow-hidden text-black/90">
            <CardHeader className="border-b bg-muted/5 pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                             <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/10">
                                <HeartHandshakeIcon className="h-5 w-5 text-primary" />
                             </div>
                             <CardTitle className="text-xl font-black tracking-tight text-[#730303] uppercase">
                                Recent Contributions
                             </CardTitle>
                        </div>
                        <CardDescription className="text-xs font-bold uppercase tracking-wider">
                            Latest Institutional Fundraising Activity
                        </CardDescription>
                    </div>
                    <div className="flex gap-4">
                         <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-[2px] border border-emerald-200 shadow-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Live reconciliation
                         </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/30">
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b min-w-[240px]">Donor Profile</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b min-w-[140px]">Amount</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b min-w-[160px]">Allocation</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b min-w-[140px]">Timing</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx, idx) => (
                                <tr 
                                    key={tx.id} 
                                    className={cn(
                                        "group border-b hover:bg-muted/10 transition-colors duration-200",
                                        idx === transactions.length - 1 ? "border-b-0" : ""
                                    )}
                                >
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-11 w-11 border-2 border-[#DAA520]/20 shadow-sm transition-transform group-hover:scale-105">
                                                <AvatarFallback className="bg-emerald-50 text-emerald-800 font-bold uppercase text-xs">
                                                    {(tx.donorName || tx.donorEmail || "A").charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="space-y-0.5">
                                                <p className="font-black text-sm uppercase tracking-tight text-[#730303] truncate max-w-[200px]">
                                                    {tx.donorName || "Anonymous Alumnus"}
                                                </p>
                                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                                    {tx.donorEmail}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="space-y-0.5">
                                             <p className="text-lg font-black tracking-tight text-emerald-600">
                                                {formatAmount(tx.amount)}
                                             </p>
                                             <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                                                Settled via Paystack
                                             </p>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col gap-1.5">
                                            {tx.digitalCard ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#DAA520]/5 text-[#DAA520] rounded-lg border border-[#DAA520]/20 w-fit">
                                                    <CreditCardIcon className="h-3 w-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Digital Card</span>
                                                </div>
                                            ) : tx.contactPerson ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 w-fit">
                                                    <UserCheckIcon className="h-3 w-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">RSVP Referral</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 w-fit">
                                                    <LandmarkIcon className="h-3 w-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Global Fund</span>
                                                </div>
                                            )}
                                            <p className="text-[9px] font-bold text-muted-foreground/70 uppercase max-w-[140px] truncate">
                                                {tx.event?.title || "Fijai Fundraiser"}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="text-[11px] font-bold text-muted-foreground uppercase opacity-80">
                                            {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className={cn(
                                            "inline-flex items-center justify-center h-8 w-8 rounded-full border-2",
                                            tx.status === "paid" 
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                                                : "bg-amber-50 text-amber-600 border-amber-200 shadow-sm"
                                        )}>
                                            {tx.status === "paid" ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {transactions.length > 5 && (
                    <div className="p-5 bg-muted/5 border-t text-center">
                         <button className="text-[10px] font-black uppercase tracking-[3px] text-muted-foreground/60 hover:text-primary transition-colors">
                            View archived transactions →
                         </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
