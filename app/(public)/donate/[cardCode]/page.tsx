
import { notFound } from "next/navigation";
import { getDigitalCardByCardCode } from "@/lib/dal/donations";
import { DonateFormClient } from "@/components/donate/DonateFormClient";


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
    // Pass full details for categories and items
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

    return (
      <DonateFormClient
        digitalCard={digitalCard}
        event={event}
        categories={categories}
      />
    );
}