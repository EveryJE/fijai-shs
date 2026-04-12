"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Record a manual/offline donation (Super Admin or RSVP user).
 */
export async function createManualDonation(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const donorEmail = formData.get("donorEmail") as string;
    const donorName = formData.get("donorName") as string;
    const amount = Number(formData.get("amount"));
    const currency = (formData.get("currency") as string) || "GHS";
    const eventId = formData.get("eventId") as string;
    const contactPersonId = formData.get("contactPersonId") as string | null;
    const digitalCardId = formData.get("digitalCardId") as string | null;
    const donationItemId = formData.get("donationItemId") as string | null;
    const momentFileUrl = formData.get("momentFileUrl") as string | null;
    const momentCaption = formData.get("momentCaption") as string | null;
    const notes = formData.get("notes") as string | null;

    if (!donorEmail || !eventId || !amount || amount <= 0) {
        throw new Error("donorEmail, eventId, and a positive amount are required");
    }

    const reference = `MANUAL-${crypto.randomUUID().substring(0, 12)}`;

    const donation = await prisma.donation.create({
        data: {
            reference,
            donorEmail,
            donorName,
            amount,
            fees: 0,
            netAmount: amount,
            currency,
            status: "paid",
            paymentMethod: "manual",
            eventId,
            contactPersonId: contactPersonId || undefined,
            digitalCardId: digitalCardId || undefined,
            donationItemId: donationItemId || undefined,
            momentFileUrl: momentFileUrl || undefined,
            momentCaption: momentCaption || undefined,
            userId: user.id,
            metadata: notes ? { notes } : undefined,
            verifiedAt: new Date(),
            paidAt: new Date(),
            donatedAt: new Date(),
        },
    });

    revalidatePath("/dashboard/donations");
    revalidatePath("/dashboard");
    return donation;
}

/**
 * Update a manual donation (only manual donations can be edited).
 */
export async function updateManualDonation(id: string, data: {
    donorName?: string;
    donorEmail?: string;
    phone?: string;
    amount?: number;
    currency?: string;
    donationItemId?: string | null;
    contactPersonId?: string | null;
    momentCaption?: string | null;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const existing = await prisma.donation.findUnique({ where: { id } });
    if (!existing || existing.paymentMethod !== "manual") {
        throw new Error("Can only edit manual donations");
    }
    if (existing.userId !== user.id) {
        throw new Error("Unauthorized: Only the creator can edit this manual donation.");
    }

    const donation = await prisma.donation.update({
        where: { id },
        data: {
            ...data,
            amount: data.amount !== undefined ? data.amount : undefined,
            fees: 0,
            netAmount: data.amount !== undefined ? data.amount : undefined,
        },
    });

    revalidatePath("/dashboard/donations");
    revalidatePath("/dashboard");
    return { success: true, donation };
}

/**
 * Delete a manual donation (only manual donations can be deleted).
 */
export async function deleteManualDonation(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const existing = await prisma.donation.findUnique({ where: { id } });
    if (!existing || existing.paymentMethod !== "manual") {
        throw new Error("Can only delete manual donations");
    }
    if (existing.userId !== user.id) {
        throw new Error("Unauthorized: Only the creator can delete this manual donation.");
    }

    await prisma.donation.delete({ where: { id } });

    revalidatePath("/dashboard/donations");
    revalidatePath("/dashboard");
    return { success: true };
}


/**
 * Update profile avatar / logo for the logged-in user.
 */
export async function updateProfileAvatar(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const avatarUrl = formData.get("avatarUrl") as string;
    if (!avatarUrl) throw new Error("avatarUrl is required");

    await prisma.profile.update({
        where: { id: user.id },
        data: { avatarUrl },
    });

    revalidatePath("/dashboard");
}
