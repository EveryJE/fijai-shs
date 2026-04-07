"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Record a manual/offline donation (Super Admin only).
 */
export async function createManualDonation(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const email = formData.get("email") as string;
    const donorName = formData.get("donorName") as string;
    const amount = Number(formData.get("amount"));
    const currency = (formData.get("currency") as string) || "GHS";
    const categoryId = formData.get("categoryId") as string | null;
    const itemId = formData.get("itemId") as string | null;
    const notes = formData.get("notes") as string | null;

    if (!email || !amount || amount <= 0) {
        throw new Error("email and a positive amount are required");
    }

    const reference = `MANUAL-${crypto.randomUUID().substring(0, 12)}`;

    const donation = await prisma.donation.create({
        data: {
            reference,
            email,
            donorName,
            amount,
            currency,
            status: "completed",
            paymentMethod: "manual",
            categoryId: categoryId || undefined,
            itemId: itemId || undefined,
            userId: user.id,
            metadata: notes ? { notes } : undefined,
            verifiedAt: new Date(),
            paidAt: new Date(),
        },
    });

    revalidatePath("/dashboard");
    return donation;
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
