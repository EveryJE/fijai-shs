import { notFound } from "next/navigation";
import { getDigitalCardByCardCode, getContactPersonByUniqueCode, getDonationsByDigitalCard, getDonationsByContactPerson } from "@/lib/dal/donations";
import { getEventWithCategories } from "@/lib/dal/events";
import { DonateFormClient } from "@/components/donate/DonateFormClient";
import { type RSVP } from "@/components/donate/RSVPList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface DonatePageProps {
  readonly params: Promise<{ readonly cardCode: string }>;
}

export default async function DonatePage({ params }: DonatePageProps) {
    const { cardCode } = await params;
    if (!cardCode) {
        notFound();
    }

    const digitalCard = await getDigitalCardByCardCode(cardCode);
    const contactPerson = !digitalCard ? await getContactPersonByUniqueCode(cardCode) : null;

    if (!digitalCard && !contactPerson) {
        notFound();
    }

    const eventId = digitalCard?.eventId || contactPerson?.eventId;
    if (!eventId) {
        notFound();
    }

    // Reuse the exact same DAL function as the admin side for consistency
    const eventEntity = await getEventWithCategories(eventId);
    if (!eventEntity) {
        notFound();
    }
    
    const categories = (eventEntity.categories || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      displayOrder: cat.displayOrder,
      items: (cat.donationItems || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        icon: item.icon,
        color: item.color,
        targetAmount: item.targetAmount ? item.targetAmount.toString() : undefined,
        currency: item.currency || "GHS",
      })),
    }));

    // Get donations linked to this specific sharer
    const donations = digitalCard 
        ? await getDonationsByDigitalCard(digitalCard.id)
        : await getDonationsByContactPerson(contactPerson!.id);
    
    const rsvps: RSVP[] = (eventEntity.contactPersons || [])
        .filter((cp: any) => cp.profile?.isActive !== false)
        .map((cp: any) => ({
            id: cp.id,
            name: cp.name,
            email: cp.email || cp.profile?.email || undefined,
            phone: cp.phone || cp.profile?.phone || undefined,
            position: (cp.metadata as any)?.position,
            avatarUrl: cp.profilePictureUrl || cp.profile?.avatarUrl || null,
            classYear: cp.classYear || cp.profile?.classYear || null,
        }));

    const totalRevenue = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    return (
      <DonateFormClient
        digitalCard={digitalCard || undefined}
        contactPerson={contactPerson || undefined}
        event={{
          id: eventEntity.id,
          title: eventEntity.title,
          description: eventEntity.description,
          startDate: eventEntity.startDate,
          endDate: eventEntity.endDate,
        }}
        categories={categories}
        rsvps={rsvps}
        totalRevenue={totalRevenue}
      />
    );
}