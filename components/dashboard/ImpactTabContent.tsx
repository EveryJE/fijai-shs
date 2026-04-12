"use client";

import { useTransition, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { HeartHandshakeIcon, Share2Icon, SparklesIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { formatAmount } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImpactTabContentProps {
  donations: any[];
  digitalCard?: any;
  rsvp?: any;
  profile?: any;
}

export function ImpactTabContent({ donations, digitalCard, rsvp, profile }: ImpactTabContentProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const shareLink = digitalCard
    ? `${window.location.origin}/donate/${digitalCard.cardCode}`
    : rsvp
      ? `${window.location.origin}/donate/${rsvp.uniqueCode}`
      : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard");
  };

  // Pagination Logic
  const totalPages = Math.ceil(donations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDonations = donations.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground overflow-hidden relative group border-none ">
          <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500">
            <HeartHandshakeIcon className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium opacity-80">Total Impact Generated</CardTitle>
          </CardHeader>
          <CardContent className="relative pt-4 pb-8">
            <div className="text-4xl font-bold ">{formatAmount(totalAmount)}</div>
            <div className="flex items-center gap-2 mt-4">
              <div className="bg-white/10 px-3 py-1 rounded-md border border-white/5 flex items-center gap-1.5">
                <SparklesIcon className="h-3.5 w-3.5 text-secondary" />
                <p className="text-xs font-semibold">{donations.length} Contributions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {shareLink && (
          <Card className="lg:col-span-2 border-none  bg-card">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-primary">Your Influence Link</CardTitle>
                  <CardDescription>Share this link to track your fundraising impact</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-muted border p-3 py-2 rounded-md text-sm flex items-center font-mono text-muted-foreground select-all">
                  {shareLink}
                </div>
                <Button className="font-semibold " onClick={copyToClipboard}>
                  Copy link
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href={shareLink} target="_blank" rel="noopener noreferrer" className="flex-1 h-9 bg-muted hover:bg-muted/80 transition-all rounded-md border flex items-center justify-center text-sm font-medium text-foreground">
                  Open Page →
                </a>
                <a href={`https://wa.me/?text=${encodeURIComponent('Support the Fijai SHS Fundraiser! Donate through my link here: ' + shareLink)}`} target="_blank" rel="noopener noreferrer" className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700  transition-all rounded-md flex items-center justify-center text-sm font-semibold text-white">
                  Share on WhatsApp
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-none  gap-y-0 overflow-hidden pt-0 bg-card">
        <CardHeader className="pb-6 border-b rounded-t-none border-t-0 ">
          <div className="flex items-center gap-3">
            <div className="bg-primary/5 p-2 rounded-md">
              <SparklesIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Your Network Impact</CardTitle>
              <CardDescription>Verified transactions credited to your referral efforts.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 ">
          <Table >
            <TableHeader className="bg-accent-50/50 uppercase">
              <TableRow>
                <TableHead>Donor Name</TableHead>
                <TableHead>Contribution</TableHead>
                <TableHead>Fund Allocation</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Verification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <HeartHandshakeIcon className="h-10 w-10 mb-2" />
                      <p className="text-sm font-medium">No impact captured yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDonations.map((d: any) => (
                  <TableRow key={d.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex flex-col">
                        <span>{d.donorName || (d.userId === profile?.id ? profile?.fullName : "Anonymous Donor")}</span>
                        <span className="text-xs font-normal text-muted-foreground">{d.donorEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-emerald-600">
                        {formatAmount(d.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.event?.title || "Fijai Fundraiser"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(d.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge variant={d.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, donations.length)} of {donations.length} contributions
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
    </div>
  );
}
