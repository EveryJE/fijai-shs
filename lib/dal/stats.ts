import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getOrgStats = cache(async () => {
    const [totalUsers, rsvpUsers, cardholders, totalDonations] = await Promise.all([
        prisma.profile.count(),
        prisma.profile.count({
            where: { roles: { has: "rsvp" } }
        }),
        prisma.profile.count({
            where: {
                digitalCards: {
                    some: {}
                }
            }
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
            digitalCard: { select: { cardCode: true, holderName: true } },
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
            digitalCard: { select: { cardCode: true, holderName: true } },
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
    // 1. Get impact by Digital Card & RSVP
    const [cardImpact, rsvpImpact] = await Promise.all([
        prisma.donation.groupBy({
            by: ['digitalCardId'],
            _sum: { netAmount: true },
            where: { status: "paid", digitalCardId: { not: null } }
        }),
        prisma.donation.groupBy({
            by: ['contactPersonId'],
            _sum: { netAmount: true },
            where: { status: "paid", contactPersonId: { not: null } }
        })
    ]);

    // 2. Fetch all unique profile IDs involved
    const cardIds = cardImpact.map(i => i.digitalCardId!).filter(Boolean);
    const rsvpIds = rsvpImpact.map(i => i.contactPersonId!).filter(Boolean);

    const [cards, rsvps] = await Promise.all([
        prisma.digitalCard.findMany({ where: { id: { in: cardIds } }, select: { id: true, profileId: true } }),
        prisma.contactPerson.findMany({ where: { id: { in: rsvpIds } }, select: { id: true, profileId: true } })
    ]);

    // 3. Aggregate total netAmount per ProfileId
    const profileTotals = new Map<string, number>();

    cardImpact.forEach(impact => {
        const profileId = cards.find(c => c.id === impact.digitalCardId)?.profileId;
        if (profileId) {
            profileTotals.set(profileId, (profileTotals.get(profileId) || 0) + Number(impact._sum.netAmount || 0));
        }
    });

    rsvpImpact.forEach(impact => {
        const profileId = rsvps.find(r => r.id === impact.contactPersonId)?.profileId;
        if (profileId) {
            profileTotals.set(profileId, (profileTotals.get(profileId) || 0) + Number(impact._sum.netAmount || 0));
        }
    });

    // 4. Find the profileId with the highest total
    let topProfileId: string | null = null;
    let maxAmount = -1;

    for (const [pid, total] of profileTotals.entries()) {
        if (total > maxAmount) {
            maxAmount = total;
            topProfileId = pid;
        }
    }

    if (!topProfileId) return null;

    return prisma.profile.findUnique({
        where: { id: topProfileId }
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

export const getDigitalCardImpact = cache(async (limit = 10) => {
    // 1. Get impact by Digital Card
    const cardImpact = await prisma.donation.groupBy({
        by: ['digitalCardId'],
        _sum: { netAmount: true },
        where: { status: "paid", digitalCardId: { not: null } }
    });

    // 2. Get impact by Contact Person (RSVP)
    const rsvpImpact = await prisma.donation.groupBy({
        by: ['contactPersonId'],
        _sum: { netAmount: true },
        where: { status: "paid", contactPersonId: { not: null } }
    });

    // 3. Fetch referee details (Profiles)
    const cardIds = cardImpact.map(i => i.digitalCardId!).filter(Boolean);
    const rsvpIds = rsvpImpact.map(i => i.contactPersonId!).filter(Boolean);

    const [cards, rsvps] = await Promise.all([
        prisma.digitalCard.findMany({ where: { id: { in: cardIds } }, select: { id: true, profileId: true, profile: { select: { fullName: true } } } }),
        prisma.contactPerson.findMany({ where: { id: { in: rsvpIds } }, select: { id: true, profileId: true, profile: { select: { fullName: true } } } })
    ]);

    // 4. Aggregate by Profile Name in a Map
    const resultsMap = new Map<string, number>();

    cardImpact.forEach(impact => {
        const card = cards.find(c => c.id === impact.digitalCardId);
        const name = card?.profile?.fullName || "Anonymous Ref";
        resultsMap.set(name, (resultsMap.get(name) || 0) + Number(impact._sum.netAmount || 0));
    });

    rsvpImpact.forEach(impact => {
        const rsvp = rsvps.find(r => r.id === impact.contactPersonId);
        const name = rsvp?.profile?.fullName || "Anonymous Ref";
        resultsMap.set(name, (resultsMap.get(name) || 0) + Number(impact._sum.netAmount || 0));
    });

    // 5. Convert to array, sort, and limit
    return Array.from(resultsMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, limit);
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

