import { notFound } from "next/navigation";
import { getActiveEvent } from "@/lib/dal/stats";
import { getEventWithCategories } from "@/lib/dal/events";
import { prisma } from "@/lib/prisma";
import { DonateFormClient } from "@/components/donate/DonateFormClient";

export default async function Home() {
    const activeEventSummary = await getActiveEvent();
    if (!activeEventSummary) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 text-center">
                <p className="text-xl text-muted-foreground">No active campaigns at the moment. Please check back later!</p>
            </div>
        );
    }
    
    // Fetch full event with categories
    const event = await getEventWithCategories(activeEventSummary.id);
    if (!event) {
        notFound();
    }
    
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

    // Fetch recent general donations for the event
    const donations = await prisma.donation.findMany({
        where: { eventId: event.id, status: "paid" },
        include: { donationItem: true, event: true, contactPerson: true },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    
    const rsvps = donations.map((d: any) => ({
        id: d.id,
        name: d.donorName || "Anonymous",
        email: d.donorEmail || undefined,
        phone: d.phone || undefined,
        amount: Number(d.amount),
        reference: d.reference,
        position: (d.contactPerson?.name) || (d.metadata as any)?.position || undefined,
        avatarUrl: d.contactPerson?.profilePictureUrl || (d.metadata as any)?.avatarUrl || undefined,
        classYear: d.contactPerson?.classYear || (d.metadata as any)?.classYear || undefined,
    }));

    const totalRevenue = donations.reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0);

    return (
      <DonateFormClient
        event={event as any}
        categories={categories}
        rsvps={rsvps}
        totalRevenue={totalRevenue}
      />
    );
}