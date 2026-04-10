"use client";

import type React from "react";
import { useState } from "react";
import { usePaystack } from "@/hooks/usePaystack";

import { DonateForm } from "./DonateForm";
import { DonateHeader } from "./DonateHeader";
import { DonateSuccess } from "./DonateSuccess";

interface DonateItem {
  id: string;
  targetAmount?: string;
}

interface DonateCategory {
  id: string;
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
  digitalCard: DonateDigitalCard;
  event: DonateEvent;
  categories: DonateCategory[];
}

export const DonateFormClient: React.FC<DonateFormClientProps> = ({
  digitalCard,
  event,
  categories,
}) => {
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { initiateDonation, loading } = usePaystack();

  const handleDonate = async (data: {
    category: string;
    item: string;
    name: string;
    email: string;
    phone: string;
  }) => {
    setSubmitting(true);
    setError(null);
    try {
      // Find the selected category and item to get the targetAmount
      const selectedCategory = categories.find(
        (cat) => cat.id === data.category,
      );
      const selectedItem = selectedCategory?.items.find(
        (it) => it.id === data.item,
      );
      const amount = selectedItem?.targetAmount
        ? Number(selectedItem.targetAmount)
        : 0;
      if (!amount || Number.isNaN(amount)) {
        setError("Invalid or missing donation amount.");
        setSubmitting(false);
        return;
      }
      await initiateDonation(
        {
          email: data.email,
          amount,
          donorName: data.name,
          phone: data.phone,
          digitalCardId: digitalCard.id,
          donationItemId: data.item,
          metadata: { category: data.category },
          eventId: event.id,
        },
        {
          onSuccess: () => {
            setSuccess(true);
            setSubmitting(false);
          },
          onCancel: () => {
            setSubmitting(false);
          },
        },
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
      {/* Event Details */}
      <div
        style={{
          marginBottom: 24,
          background: "#f8f8fa",
          borderRadius: 8,
          padding: 16,
        }}
      >
        <h3 style={{ margin: 0 }}>{event.title}</h3>
        {event.description && (
          <div style={{ color: "#555", marginTop: 4 }}>{event.description}</div>
        )}
        {(event.startDate || event.endDate) && (
          <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
            {event.startDate && (
              <span>
                Start: {new Date(event.startDate).toLocaleDateString()}
              </span>
            )}
            {event.endDate && (
              <span style={{ marginLeft: 12 }}>
                End: {new Date(event.endDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>
      <DonateHeader
        holderName={digitalCard.holderName}
        alias={digitalCard.alias || digitalCard.cardCode}
      />
      {success ? (
        <DonateSuccess />
      ) : (
        <DonateForm
          categories={categories}
          onSubmit={handleDonate}
          submitting={submitting || loading}
          error={error}
        />
      )}
    </div>
  );
};
