import { notFound } from "next/navigation";
import { getActiveEvent, getOrganization } from "@/lib/dal/stats";
import { getEventWithCategories } from "@/lib/dal/events";
import { prisma } from "@/lib/prisma";
import { DonateFormClient } from "@/components/donate/DonateFormClient";

export default async function Home() {
    const [activeEventSummary, organization] = await Promise.all([
        getActiveEvent(),
        getOrganization()
    ]);

    if (!activeEventSummary) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 text-center">
                <p className="text-xl text-muted-foreground">No active campaigns at the moment. Please check back later!</p>
            </div>
        );
    }
    
    // Fetch full event with categories and registered ContactPersons (RSVPs)
    const event = await prisma.event.findUnique({
        where: { id: activeEventSummary.id },
        include: {
            categories: {
                orderBy: { displayOrder: "asc" },
                include: {
                    donationItems: {
                        orderBy: { displayOrder: "asc" },
                    },
                },
            },
            contactPersons: {
                orderBy: { createdAt: "asc" },
                include: {
                    profile: true
                }
            }
        },
    });

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

    // Use registered contact persons as RSVPs
    const rsvps = (event.contactPersons || []).map((cp: any) => ({
        id: cp.id,
        name: cp.name,
        email: cp.email || undefined,
        phone: cp.phone || undefined,
        amount: 0, // Registered RSVPs don't necessarily have an amount here
        reference: cp.uniqueCode,
        position: (cp.metadata as any)?.position || undefined,
        avatarUrl: cp.profilePictureUrl || cp.profile?.avatarUrl || undefined,
        classYear: cp.classYear || undefined,
    }));

    // Fetch total revenue from all donations for this event
    const donationAgg = await prisma.donation.aggregate({
        _sum: { amount: true },
        where: { eventId: event.id, status: "paid" }
    });
    
    const totalRevenue = Number(donationAgg._sum?.amount || 0);

    return (
      <DonateFormClient
        event={event as any}
        categories={categories}
        rsvps={rsvps}
        totalRevenue={totalRevenue}
        organizationName={organization?.name}
      />
    );
}