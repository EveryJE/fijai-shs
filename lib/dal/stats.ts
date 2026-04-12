import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getOrgStats = cache(async () => {
    const [totalUsers, rsvpUsers, cardholders, totalDonations] = await Promise.all([
        prisma.profile.count(),
        prisma.profile.count({
            where: { roles: { has: "rsvp" } }
        }),
        prisma.profile.count({
            where: { roles: { has: "cardholder" } }
        }),
        prisma.donation.aggregate({
            _sum: {
                netAmount: true
            },
            where: {
                status: "paid"
            }
        })
    ]);

    return {
        totalUsers,
        rsvpUsers,
        cardholders,
        totalDonated: Number(totalDonations?._sum?.netAmount || 0),
    };
});

export const getOrganization = cache(async () => {
    return prisma.organization.findFirst();
});

export const getDonationBreakdown = cache(async () => {
    const [paystackAgg, manualAgg, paystackCount, manualCount] = await Promise.all([
        prisma.donation.aggregate({
            _sum: { netAmount: true },
            where: { status: "paid", paymentMethod: "paystack" },
        }),
        prisma.donation.aggregate({
            _sum: { netAmount: true },
            where: { status: "paid", paymentMethod: "manual" },
        }),
        prisma.donation.count({ where: { status: "paid", paymentMethod: "paystack" } }),
        prisma.donation.count({ where: { status: "paid", paymentMethod: "manual" } }),
    ]);

    return {
        paystackTotal: Number(paystackAgg._sum?.netAmount || 0),
        manualTotal: Number(manualAgg._sum?.netAmount || 0),
        paystackCount,
        manualCount,
    };
});

export const getRecentTransactions = cache(async (limit = 10) => {
    const transactions = await prisma.donation.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            contactPerson: true,
            digitalCard: true,
            donationItem: true,
            event: true
        }
    });

    return transactions.map(tx => ({
        ...tx,
        amount: Number(tx.amount),
        netAmount: Number(tx.netAmount || 0),
        fees: Number(tx.fees || 0),
        donationItem: tx.donationItem ? {
            ...tx.donationItem,
            targetAmount: tx.donationItem.targetAmount ? Number(tx.donationItem.targetAmount) : null
        } : null
    }));
});

export const getDonationsByMethod = cache(async (method: "paystack" | "manual", limit = 50) => {
    const donations = await prisma.donation.findMany({
        where: { paymentMethod: method },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            contactPerson: true,
            digitalCard: true,
            donationItem: true,
            event: true
        }
    });

    return donations.map(tx => ({
        ...tx,
        amount: Number(tx.amount),
        netAmount: Number(tx.netAmount || 0),
        fees: Number(tx.fees || 0),
        donationItem: tx.donationItem ? {
            ...tx.donationItem,
            targetAmount: tx.donationItem.targetAmount ? Number(tx.donationItem.targetAmount) : null
        } : null
    }));
});

export const getActiveEvents = cache(async () => {
    return prisma.event.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
    });
});

export const getMostImpactUser = cache(async () => {
    // Group donations by userId and find the one with the highest sum
    const topDonor = await prisma.donation.groupBy({
        by: ['userId'],
        _sum: {
            netAmount: true
        },
        where: {
            status: "paid",
            userId: { not: null }
        },
        orderBy: {
            _sum: {
                netAmount: "desc"
            }
        },
        take: 1
    });

    if (!topDonor.length || !topDonor[0].userId) return null;

    return prisma.profile.findUnique({
        where: { id: topDonor[0].userId }
    });
});

export const getMonthlyRevenue = cache(async () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const sum = await prisma.donation.aggregate({
            _sum: { netAmount: true },
            where: {
                status: "paid",
                createdAt: {
                    gte: d,
                    lt: nextD
                }
            }
        });

        last6Months.push({
            month: months[d.getMonth()],
            revenue: Number(sum._sum?.netAmount || 0)
        });
    }

    return last6Months;
});

export const getActiveEvent = cache(async () => {
    return prisma.event.findFirst({
        where: { status: "active" },
        orderBy: { createdAt: "desc" }
    });
});

export const getDigitalCardImpact = cache(async (limit = 5) => {
    const impact = await prisma.donation.groupBy({
        by: ['digitalCardId'],
        _sum: {
            netAmount: true
        },
        where: {
            status: "paid",
            digitalCardId: { not: null }
        },
        orderBy: {
            _sum: {
                netAmount: "desc"
            }
        },
        take: limit
    });

    // Fetch card details for these impacts
    const cardIds = impact.map(i => i.digitalCardId!).filter(Boolean);
    const cards = await prisma.digitalCard.findMany({
        where: { id: { in: cardIds } },
        include: {
            profile: true
        }
    });

    return impact.map(i => {
        const card = cards.find(c => c.id === i.digitalCardId);
        return {
            name: card?.profile?.fullName || card?.cardCode || "Unknown",
            amount: Number(i._sum?.netAmount || 0)
        };
    });
});

export const getDonationByItemCategory = cache(async () => {
    const categories = await prisma.category.findMany({
        include: {
            donationItems: {
                include: {
                    donations: {
                        where: { status: "paid" },
                        select: { netAmount: true }
                    }
                }
            }
        }
    });

    return categories.map(cat => {
        const total = cat.donationItems.reduce((sum, item) => {
            return sum + item.donations.reduce((s, d) => s + Number(d.netAmount), 0);
        }, 0);

        return {
            name: cat.name,
            value: total,
            fill: cat.color || "#730303"
        };
    }).filter(c => c.value > 0);
});

