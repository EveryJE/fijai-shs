"use client";

import { useState, useTransition, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createManualDonation, updateManualDonation } from "@/lib/actions/donations";
import { useRouter } from "next/navigation";
import { HandCoinsIcon, Loader2 } from "lucide-react";

interface ManualDonationSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    donation?: any | null;
    events: { id: string; title: string }[];
}

export function ManualDonationSheet({ open, onOpenChange, donation, events }: ManualDonationSheetProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const isEditing = !!donation;

    const [formData, setFormData] = useState({
        donorName: "",
        donorEmail: "",
        phone: "",
        amount: "",
        eventId: "",
        momentCaption: "",
    });

    useEffect(() => {
        if (donation) {
            setFormData({
                donorName: donation.donorName || "",
                donorEmail: donation.donorEmail || "",
                phone: donation.phone || "",
                amount: String(donation.amount || ""),
                eventId: donation.event?.id || "",
                momentCaption: donation.momentCaption || "",
            });
        } else {
            setFormData({
                donorName: "",
                donorEmail: "",
                phone: "",
                amount: "",
                eventId: events[0]?.id || "",
                momentCaption: "",
            });
        }
    }, [donation, open, events]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.donorEmail || !formData.amount || !formData.eventId) {
            toast.error("Please fill in all required fields.");
            return;
        }

        startTransition(async () => {
            try {
                if (isEditing) {
                    await updateManualDonation(donation.id, {
                        donorName: formData.donorName || undefined,
                        donorEmail: formData.donorEmail,
                        phone: formData.phone || undefined,
                        amount: Number(formData.amount),
                        momentCaption: formData.momentCaption || null,
                    });
                    toast.success("Donation updated");
                } else {
                    const fd = new FormData();
                    fd.set("donorName", formData.donorName);
                    fd.set("donorEmail", formData.donorEmail);
                    fd.set("amount", formData.amount);
                    fd.set("eventId", formData.eventId);
                    if (formData.phone) fd.set("phone", formData.phone);
                    if (formData.momentCaption) fd.set("notes", formData.momentCaption);
                    
                    await createManualDonation(fd);
                    toast.success("Manual donation recorded");
                }
                onOpenChange(false);
                router.refresh();
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Something went wrong");
            }
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
            <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full">
                <SheetHeader className="flex-shrink-0 p-6 border-b bg-background z-10">
                    <SheetTitle className="flex items-center gap-2">
                        <HandCoinsIcon className="h-5 w-5" />
                        {isEditing ? "Edit Manual Donation" : "Record Manual Donation"}
                    </SheetTitle>
                    <SheetDescription>
                        {isEditing 
                            ? "Update the details of this cash donation." 
                            : "Record a cash or offline donation received."}
                    </SheetDescription>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <form id="manual-donation-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="donorName">Donor Name</Label>
                                <Input
                                    id="donorName"
                                    value={formData.donorName}
                                    onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                                    placeholder="e.g. Kwame Asante"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="donorEmail">Donor Email *</Label>
                                <Input
                                    id="donorEmail"
                                    type="email"
                                    value={formData.donorEmail}
                                    onChange={(e) => setFormData({ ...formData, donorEmail: e.target.value })}
                                    placeholder="donor@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="024XXXXXXX"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (GHS) *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="eventId">Event *</Label>
                                <Select
                                    value={formData.eventId}
                                    onValueChange={(value) => { if (value) setFormData({ ...formData, eventId: value }); }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select event" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {events.map((ev) => (
                                            <SelectItem key={ev.id} value={ev.id}>
                                                {ev.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.momentCaption}
                                onChange={(e) => setFormData({ ...formData, momentCaption: e.target.value })}
                                placeholder="Any notes about this donation..."
                                className="min-h-[80px]"
                            />
                        </div>
                    </form>
                </div>

                <div className="flex-shrink-0 p-6 border-t bg-background z-10 flex gap-3">
                    <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1" 
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        form="manual-donation-form" 
                        className="flex-1" 
                        disabled={isPending}
                    >
                        {isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : isEditing ? (
                            "Update Donation"
                        ) : (
                            "Record Donation"
                        )}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
