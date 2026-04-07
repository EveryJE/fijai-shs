import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getDonationsByUser = cache(async (userId: string) => {
    return prisma.donation.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
});

export const getDonationByReference = cache(async (reference: string) => {
    return prisma.donation.findUnique({ where: { reference } });
});

export const getDonationById = cache(async (id: string) => {
    return prisma.donation.findUnique({ where: { id } });
});

export const getDonationsByCategory = cache(async (categoryId: string) => {
    return prisma.donation.findMany({
        where: { categoryId, status: "completed" },
        orderBy: { createdAt: "desc" },
    });
});

export const getDonationStats = cache(async () => {
    const [total, completed, totalAmount] = await Promise.all([
        prisma.donation.count(),
        prisma.donation.count({ where: { status: "completed" } }),
        prisma.donation.aggregate({
            where: { status: "completed" },
            _sum: { amount: true },
        }),
    ]);

    return {
        total,
        completed,
        totalAmount: totalAmount._sum.amount ?? 0,
    };
});
