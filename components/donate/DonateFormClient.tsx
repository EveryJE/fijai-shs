"use client";

import type React from "react";
import { useState } from "react";
import { usePaystack } from "@/hooks/usePaystack";
import { DonateForm } from "./DonateForm";
import { DonateHeader } from "./DonateHeader";
import { DonationSuccessDialog } from "./DonationSuccessDialog";
import { RSVPList, type RSVP } from "./RSVPList";
import { Users, ArrowDown, UsersIcon, HeartIcon, CameraIcon, MessageSquareQuoteIcon, UserCircleIcon, EyeIcon } from "lucide-react";
import { formatAmount, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DonateItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  targetAmount?: string;
  displayOrder?: number;
}

interface DonateCategory {
  id: string;
  name: string;
  color: string;
  displayOrder: number;
  items: DonateItem[];
}

interface DonateDigitalCard {
  id: string;
  cardCode: string;
  holderName?: string;
  alias?: string;
}

interface DonateEvent {
  id: string;
  title: string;
  description?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
}



interface DonateFormClientProps {
  digitalCard?: DonateDigitalCard;
  event: DonateEvent;
  categories: DonateCategory[];
  rsvps?: RSVP[];
  totalRevenue?: number;
  recentDonations?: {
      id: string;
      donorName: string | null;
      amount: number;
      currency: string;
      createdAt: string | Date;
      momentFileUrl?: string | null;
      momentCaption?: string | null;
  }[];
  organizationName?: string;
}

/**
 * Rebuilt Donation Form Client
 * Featuring a two-column responsive layout with registered RSVPs.
 */
export const DonateFormClient: React.FC<DonateFormClientProps> = ({
  digitalCard,
  event,
  categories,
  rsvps = [],
  totalRevenue = 0,
  recentDonations = [],
  organizationName,
}) => {
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [successData, setSuccessData] = useState<{ reference: string; amount: number; donorName: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { initiateDonation, loading } = usePaystack();

  const handleDonate = async (data: {
    category: string;
    item: string;
    name: string;
    email: string;
    phone: string;
    momentFileUrl?: string;
    momentCaption?: string;
    amount?: number;
  }) => {
    setSubmitting(true);
    setError(null);
    try {
      if (!data.amount || Number.isNaN(data.amount)) {
        setError("Please enter a valid donation amount.");
        setSubmitting(false);
        return;
      }

      await initiateDonation(
        {
          email: data.email,
          amount: data.amount,
          donorName: data.name,
          phone: data.phone,
          digitalCardId: digitalCard?.id,
          donationItemId: data.item,
          momentFileUrl: data.momentFileUrl,
          momentCaption: data.momentCaption,
          metadata: { category: data.category },
          eventId: event.id,
        },
        {
          onSuccess: (tx) => {
            setSuccessData({
              reference: tx.reference,
              amount: data.amount!,
              donorName: data.name
            });
            setSubmitting(false);
          },
          onCancel: () => {
            setSubmitting(false);
          },
        },
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Institutional payment failed");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="bg-cover bg-primary/10 bg-center bg-no-repeat bg-fixed min-h-screen pb-12"
      style={{
        backgroundImage: "url('/donate-bg.svg')",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-start justify-center gap-8 pt-4">
        
        {/* Main Form Container - Preserving original max-w-3xl look */}
        <div className="max-w-3xl w-full bg-white/50 backdrop-blur-sm overflow-hidden shrink-0">
          <div className="h-48 bg-[url('/school-gate.jpg')] bg-cover bg-center rounded-t-xl"/>
           <DonateHeader
              eventTitle={event.title}
              eventDescription={event.description || "Establish your impact and contribute to the Fijai SHS Alumni Institutional Fund."}
              digitalCodeUserName={digitalCard?.holderName || digitalCard?.alias || 'General Fund'}
              organizationName={organizationName}
            />
          <div className="p-4 md:p-6">
           

            <DonateForm
              categories={categories}
              onSubmit={handleDonate}
              submitting={submitting || loading}
              error={error}
            />

            <div className="mt-8 text-center font-playfair animate-pulse opacity-40 text-[10px] uppercase tracking-widest">
              Powered By KoalaKlick
            </div>
          </div>
        </div>

        {/* RSVP & Wall of Impact Side Content */}
        <div className="w-full md:w-[350px] space-y-6">
          <RSVPList 
            id="rsvp-section"
            rsvps={rsvps} 
            organizationName={organizationName} 
          />

          {/* Wall of Impact */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-primary/10 shadow-xl overflow-hidden animate-in slide-in-from-right-10 duration-1000">
             <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between">
                 <div className="flex items-center gap-2">
                     <HeartIcon className="h-4 w-4 fill-current" />
                     <h3 className="text-sm font-black uppercase tracking-widest">Wall of Impact</h3>
                 </div>
                 <span className="text-[10px] font-bold opacity-60 uppercase">{recentDonations.length} Contributions</span>
             </div>
             
             <div className="p-2 max-h-[400px] overflow-y-auto space-y-2 scrollbar-hide">
                 {recentDonations.length === 0 ? (
                     <div className="py-12 text-center">
                         <HeartIcon className="h-6 w-6 mx-auto mb-2 text-primary/20" />
                         <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Awaiting First Impact</p>
                     </div>
                 ) : (
                     recentDonations.map((d) => (
                         <button 
                            key={d.id}
                            onClick={() => setSelectedDonation(d)}
                            className="w-full text-left p-3 rounded-xl hover:bg-primary/5 transition-all flex items-center justify-between group border border-transparent hover:border-primary/10"
                         >
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <UserCircleIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold truncate max-w-[120px]">{d.donorName || 'Anonymous'}</p>
                                    <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-emerald-600">{formatAmount(d.amount)}</p>
                                {(d.momentFileUrl || d.momentCaption) && (
                                    <div className="flex items-center justify-end gap-1 text-primary animate-pulse">
                                         <CameraIcon className="h-2.5 w-2.5" />
                                         <span className="text-[8px] font-black uppercase tracking-tighter">Memory</span>
                                    </div>
                                )}
                            </div>
                         </button>
                     ))
                 )}
             </div>
          </div>
        </div>

        {/* High-fidelity Success Dialog */}
        <DonationSuccessDialog
          isOpen={!!successData}
          onClose={() => setSuccessData(null)}
          reference={successData?.reference || ""}
          amount={successData?.amount || 0}
          donorName={successData?.donorName}
          eventTitle={event.title}
          eventDescription={event.description || undefined}
        />

        {/* Alumni Memory Dialog */}
        <Dialog open={!!selectedDonation} onOpenChange={(open) => !open && setSelectedDonation(null)}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                <div className="bg-[#730303] p-8 text-white text-center relative overflow-hidden">
                     {/* Decorative pattern */}
                     <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                     
                     <HeartIcon className="h-12 w-12 mx-auto mb-4 opacity-40 fill-current" />
                     <h2 className="text-2xl font-black uppercase tracking-widest mb-1">Impact Record</h2>
                     <p className="text-[11px] font-bold opacity-60 uppercase tracking-[4px]">Celebrating Alumni Generosity</p>
                     
                     <div className="mt-8">
                         <p className="text-4xl font-black">{formatAmount(selectedDonation?.amount || 0)}</p>
                         <p className="text-sm font-medium opacity-80 mt-2">contributed by {selectedDonation?.donorName || 'Anonymous Alumnus'}</p>
                     </div>
                </div>

                <div className="p-8">
                    {selectedDonation?.momentFileUrl || selectedDonation?.momentCaption ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                 <CameraIcon className="h-4 w-4 text-[#730303]" />
                                 <h4 className="text-[11px] font-black uppercase tracking-widest text-[#730303]">The Alumni Moment</h4>
                            </div>

                            {selectedDonation?.momentFileUrl && (
                                <div className="aspect-square w-full rounded-2xl overflow-hidden border-4 border-muted/30 shadow-inner group">
                                     <img 
                                        src={selectedDonation.momentFileUrl} 
                                        alt="Memory" 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                     />
                                </div>
                            )}

                            {selectedDonation?.momentCaption && (
                                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 relative">
                                    <MessageSquareQuoteIcon className="absolute -top-3 -left-3 h-8 w-8 text-primary/20" />
                                    <p className="text-sm text-muted-foreground leading-relaxed italic text-center">
                                        "{selectedDonation.momentCaption}"
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-12 text-center opacity-20 italic">
                            <p className="text-sm">This contributor chose to remain discreet with their memory.</p>
                        </div>
                    )}

                    <Button 
                        onClick={() => setSelectedDonation(null)}
                        className="w-full mt-8 h-12 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                    >
                        Close Tribute
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
