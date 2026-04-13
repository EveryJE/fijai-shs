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
    
    // Reuse the exact same DAL function for consistency
    const event = await getEventWithCategories(activeEventSummary.id);

    if (!event) {
        notFound();
    }
    
    const categories = (event.categories || []).map((cat: any) => ({
      ...cat,
      items: (cat.donationItems || []).map((item: any) => ({
        ...item,
        targetAmount: item.targetAmount ? item.targetAmount.toString() : undefined,
        currency: item.currency || "GHS",
      })),
    }));

    // Use registered contact persons as RSVPs - only show active ones
    const rsvps = (event.contactPersons || [])
      .filter((cp: any) => cp.profile?.isActive !== false) // Default to true if profile is missing for some reason, but usually it should be there
      .map((cp: any) => ({
        id: cp.id,
        name: cp.name,
        email: cp.email || cp.profile?.email || undefined,
        phone: cp.phone || cp.profile?.phone || undefined,
        amount: 0,
        reference: cp.uniqueCode,
        position: (cp.metadata as any)?.position || undefined,
        avatarUrl: cp.profilePictureUrl || cp.profile?.avatarUrl || undefined,
        classYear: cp.classYear || cp.profile?.classYear || undefined,
    }));

    // Calculate total revenue from pre-fetched donations
    const totalRevenue = event.donations.reduce((sum, d: any) => sum + (Number(d.netAmount) || 0), 0);

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