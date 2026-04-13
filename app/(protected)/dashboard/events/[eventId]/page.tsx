import { notFound } from "next/navigation";
import { getEventWithCategories } from "@/lib/dal/events";
import { EventDetailClient } from "@/components/event/EventDetailClient";
import { createClient } from "@/utils/supabase/server";
import { getProfileByEmail } from "@/lib/dal";

interface EventDetailPageProps {
    params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
    const { eventId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [event, profile] = await Promise.all([
        getEventWithCategories(eventId),
        user?.email ? getProfileByEmail(user.email) : null
    ]);

    const isAdmin = profile?.roles?.map((r: string) => r.toLowerCase()).includes("admin") ||
        user?.email === process.env.SUPER_ADMIN_EMAIL ||
        user?.email === "ama@yopmail.com";

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

    return <EventDetailClient event={typedEvent} isAdmin={isAdmin} />;
}