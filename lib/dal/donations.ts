import { cache } from "react";
import { prisma } from "@/lib/prisma";

const donationIncludes = {
    contactPerson: true,
    digitalCard: true,
    donationItem: true,
    event: true,
} as const;

export const getDigitalCardByCardCode = cache(async (cardCode: string | undefined) => {
    if (!cardCode) return null;
    return prisma.digitalCard.findUnique({
        where: { cardCode, isActive: true },
        include: {
            event: {
                include: {
                    categories: {
                        orderBy: { displayOrder: "asc" },
                        include: {
                            donationItems: {
                                orderBy: { displayOrder: "asc" },
                            },
                        },
                    },
                },
            },
        },
    });
});

export const getDonationsByUser = cache(async (userId: string) => {
    return prisma.donation.findMany({
        where: { userId },
        include: donationIncludes,
        orderBy: { createdAt: "desc" },
    });
});

export const getDonationByReference = cache(async (reference: string) => {
    return prisma.donation.findUnique({
        where: { reference },
        include: donationIncludes,
    });
});

export const getDonationById = cache(async (id: string) => {
    return prisma.donation.findUnique({
        where: { id },
        include: donationIncludes,
    });
});

export const getDonationsByContactPerson = cache(async (contactPersonId: string) => {
    return prisma.donation.findMany({
        where: { contactPersonId, status: "paid" },
        include: { donationItem: true, event: true },
        orderBy: { createdAt: "desc" },
    });
});

export const getDonationsByDigitalCard = cache(async (digitalCardId: string) => {
    return prisma.donation.findMany({
        where: { digitalCardId, status: "paid" },
        include: { donationItem: true, event: true, contactPerson: true },
        orderBy: { createdAt: "desc" },
    });
});

export const getDonationsByItem = cache(async (donationItemId: string) => {
    return prisma.donation.findMany({
        where: { donationItemId, status: "paid" },
        include: { contactPerson: true, digitalCard: true, event: true },
        orderBy: { createdAt: "desc" },
    });
});

export const getDonationsByEvent = cache(async (eventId: string) => {
    return prisma.donation.findMany({
        where: { eventId, status: "paid" },
        include: { contactPerson: true, digitalCard: true, donationItem: true },
        orderBy: { createdAt: "desc" },
    });
});

export const getDonationStats = cache(async () => {
    const [total, paid, totalAmount] = await Promise.all([
        prisma.donation.count(),
        prisma.donation.count({ where: { status: "paid" } }),
        prisma.donation.aggregate({
            where: { status: "paid" },
            _sum: { amount: true },
        }),
    ]);

    return {
        total,
        paid,
        totalAmount: totalAmount._sum.amount ?? 0,
    };
});
