import { notFound } from "next/navigation";
import { getEventWithCategories } from "@/lib/dal/events";
import { EventDetailClient } from "@/components/event/EventDetailClient";

interface EventDetailPageProps {
    params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
    const { eventId } = await params;
    const event = await getEventWithCategories(eventId);

    if (!event) {
        notFound();
    }

    const typedEvent = {
        ...event,
        categories: event.categories.map((cat: any) => ({
            ...cat,
            donationItems: cat.donationItems.map((item: any) => ({
                ...item,
                targetAmount: item.targetAmount ? Number(item.targetAmount) : null
            }))
        })),
        donations: (event as any).donations?.map((d: any) => ({
            ...d,
            amount: Number(d.amount),
            netAmount: Number(d.netAmount || 0),
            fees: Number(d.fees || 0)
        })) || []
    } as any;

    return <EventDetailClient event={typedEvent} />;
}