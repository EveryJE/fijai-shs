"use client";

import type React from "react";
import { useState } from "react";
import { usePaystack } from "@/hooks/usePaystack";
import { DonateForm } from "./DonateForm";
import { DonateHeader } from "./DonateHeader";
import { DonationSuccessDialog } from "./DonationSuccessDialog";
import { RSVPList } from "./RSVPList";
import { Users, ArrowDown, UsersIcon } from "lucide-react";

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

interface RSVP {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  amount?: number;
  reference?: string;
  position?: string | null;
  avatarUrl?: string | null;
  classYear?: string | null;
}

interface DonateFormClientProps {
  digitalCard?: DonateDigitalCard;
  event: DonateEvent;
  categories: DonateCategory[];
  rsvps?: RSVP[];
  totalRevenue?: number;
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
  organizationName,
}) => {
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

        {/* RSVP Side Content - Peer to the form */}
        <div className="w-full md:w-[350px] sticky top-4">
          <RSVPList 
            id="rsvp-section"
            rsvps={rsvps} 
            organizationName={organizationName} 
          />
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
      </div>
    </div>
  );
};
