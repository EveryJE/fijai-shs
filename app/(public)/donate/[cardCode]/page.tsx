
import { notFound } from "next/navigation";
import { getDigitalCardByCardCode, getDonationsByDigitalCard } from "@/lib/dal/donations";
import { DonateFormClient } from "@/components/donate/DonateFormClient";
import { prisma } from "@/lib/prisma";


interface DonatePageProps {
  readonly params: Promise<{ readonly cardCode: string }>;
}

export default async function DonatePage({ params }: DonatePageProps) {
    const { cardCode } = await params;
    if (!cardCode) {
        notFound();
    }
    const digitalCard = await getDigitalCardByCardCode(cardCode);
    if (!digitalCard) {
        notFound();
    }
    const event = digitalCard.event;
    
    const categories = (event.categories || []).map((cat: any) => ({
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
        displayOrder: item.displayOrder,
      })),
    }));

    const donations = await getDonationsByDigitalCard(digitalCard.id);
    
    const rsvps = (event.contactPersons || []).map((cp: any) => ({
        id: cp.id,
        name: cp.name,
        email: cp.email || undefined,
        phone: cp.phone || undefined,
        position: (cp.metadata as any)?.position || "Project Lead",
        avatarUrl: cp.profilePictureUrl || null,
        classYear: cp.classYear || null,
    }));

    const totalRevenue = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    return (
      <DonateFormClient
        digitalCard={digitalCard}
        event={event}
        categories={categories}
        rsvps={rsvps}
        totalRevenue={totalRevenue}
      />
    );
}