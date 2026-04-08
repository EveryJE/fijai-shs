"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCardIcon, HeartHandshakeIcon, Share2Icon } from "lucide-react";
import { formatAmount } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImpactTabContentProps {
  donations: any[];
  digitalCard?: any;
  rsvp?: any;
}

export function ImpactTabContent({ donations, digitalCard, rsvp }: ImpactTabContentProps) {
  const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const shareLink = digitalCard 
    ? `${window.location.origin}/card/${digitalCard.cardCode}`
    : rsvp 
    ? `${window.location.origin}/contact/${rsvp.uniqueCode}`
    : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-md bg-[#730303] text-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-white/70">Total Individual Impact</CardTitle>
            <HeartHandshakeIcon className="h-4 w-4 text-white/50" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tight">{formatAmount(totalAmount)}</div>
            <p className="text-[10px] text-white/60 mt-1 font-semibold uppercase">Shared across {donations.length} donors</p>
          </CardContent>
        </Card>

        {shareLink && (
           <Card className="border-none shadow-md bg-white border border-muted ring-1 ring-muted shadow-primary/5">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">My Referral Link</CardTitle>
                <Share2Icon className="h-4 w-4 text-primary/50" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <div className="flex-1 bg-muted p-2 rounded text-xs truncate font-mono text-muted-foreground">
                        {shareLink}
                    </div>
                    <Button size="sm" variant="outline" className="h-8 font-bold uppercase tracking-widest text-[10px]" onClick={copyToClipboard}>
                        Copy link
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase leading-relaxed">
                    Personalized link for donation tracking. Every donation through this link is credited to your impact dashboard.
                </p>
              </CardContent>
           </Card>
        )}
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white">
        <CardHeader className="bg-muted/30 pb-4">
             <div className="flex items-center gap-2">
                 <CreditCardIcon className="h-5 w-5 text-primary" />
                 <CardTitle className="text-xl">Your Referral Network</CardTitle>
             </div>
             <CardDescription>Transactions credited to your efforts.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="font-bold uppercase tracking-widest text-[10px]">Donor</TableHead>
                <TableHead className="font-bold uppercase tracking-widest text-[10px]">Amount</TableHead>
                <TableHead className="font-bold uppercase tracking-widest text-[10px]">Event</TableHead>
                <TableHead className="font-bold uppercase tracking-widest text-[10px]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-xs uppercase tracking-widest font-bold opacity-30">
                        No referrals captured yet
                     </TableCell>
                  </TableRow>
              ) : (
                donations.map((d: any) => (
                  <TableRow key={d.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-bold text-foreground">
                       {d.donorName || "Anonymous Donor"}
                    </TableCell>
                    <TableCell className="font-black text-emerald-600">
                       {formatAmount(d.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-semibold uppercase tracking-tight">
                       {d.event?.title}
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground uppercase font-bold">
                       {format(new Date(d.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
