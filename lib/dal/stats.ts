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
        id: tx.id,
        reference: tx.reference,
        amount: Number(tx.amount || 0),
        netAmount: Number(tx.netAmount || 0),
        fees: Number(tx.fees || 0),
        currency: tx.currency,
        status: tx.status,
        paymentMethod: tx.paymentMethod,
        donorName: tx.donorName,
        donorEmail: tx.donorEmail,
        phone: tx.phone,
        userId: tx.userId,
        paidAt: tx.paidAt,
        createdAt: tx.createdAt,
        metadata: tx.metadata,
        momentFileUrl: tx.momentFileUrl,
        momentCaption: tx.momentCaption,
        donationItem: tx.donationItem ? {
            id: tx.donationItem.id,
            name: tx.donationItem.name,
            targetAmount: tx.donationItem.targetAmount ? Number(tx.donationItem.targetAmount) : null
        } : null,
        event: tx.event ? { id: tx.event.id, title: tx.event.title } : null,
        contactPerson: tx.contactPerson ? { name: tx.contactPerson.name } : null,
        digitalCard: tx.digitalCard
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
        id: tx.id,
        reference: tx.reference,
        amount: Number(tx.amount),
        netAmount: Number(tx.netAmount || 0),
        fees: Number(tx.fees || 0),
        currency: tx.currency,
        status: tx.status,
        paymentMethod: tx.paymentMethod,
        donorName: tx.donorName,
        donorEmail: tx.donorEmail,
        phone: tx.phone,
        userId: tx.userId,
        paidAt: tx.paidAt,
        createdAt: tx.createdAt,
        metadata: tx.metadata,
        momentFileUrl: tx.momentFileUrl,
        momentCaption: tx.momentCaption,
        donationItem: tx.donationItem ? {
            id: tx.donationItem.id,
            name: tx.donationItem.name,
            targetAmount: tx.donationItem.targetAmount ? Number(tx.donationItem.targetAmount) : null
        } : null,
        event: tx.event ? { id: tx.event.id, title: tx.event.title } : null,
        contactPerson: tx.contactPerson ? { name: tx.contactPerson.name } : null,
        digitalCard: tx.digitalCard
    }));
});

export const getActiveEvents = cache(async () => {
    return prisma.event.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
    });
});

/**
 * Shared utility to aggregate fundraising impact across RSVPs and Digital Cards
 */
const getRankedContributionImpact = cache(async () => {
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

    const cardIds = cardImpact.map(i => i.digitalCardId!).filter(Boolean);
    const rsvpIds = rsvpImpact.map(i => i.contactPersonId!).filter(Boolean);

    const [cards, rsvps] = await Promise.all([
        prisma.digitalCard.findMany({ 
            where: { id: { in: cardIds } }, 
            select: { id: true, profileId: true, profile: { select: { fullName: true } } } 
        }),
        prisma.contactPerson.findMany({ 
            where: { id: { in: rsvpIds } }, 
            select: { id: true, profileId: true, profile: { select: { fullName: true } } } 
        })
    ]);

    const profileImpactMap = new Map<string, { name: string, total: number }>();

    cardImpact.forEach(impact => {
        const card = cards.find(c => c.id === impact.digitalCardId);
        if (card?.profileId) {
            const current = profileImpactMap.get(card.profileId) || { name: card.profile?.fullName || "Anonymous", total: 0 };
            profileImpactMap.set(card.profileId, { ...current, total: current.total + Number(impact._sum.netAmount || 0) });
        }
    });

    rsvpImpact.forEach(impact => {
        const rsvp = rsvps.find(r => r.id === impact.contactPersonId);
        if (rsvp?.profileId) {
            const current = profileImpactMap.get(rsvp.profileId) || { name: rsvp.profile?.fullName || "Anonymous", total: 0 };
            profileImpactMap.set(rsvp.profileId, { ...current, total: current.total + Number(impact._sum.netAmount || 0) });
        }
    });

    return Array.from(profileImpactMap.entries())
        .map(([id, data]) => ({ id, name: data.name, amount: data.total }))
        .sort((a, b) => b.amount - a.amount);
});

export const getMostImpactUser = cache(async () => {
    const ranked = await getRankedContributionImpact();
    if (!ranked.length) return null;

    return prisma.profile.findUnique({
        where: { id: ranked[0].id }
    });
});

export const getDigitalCardImpact = cache(async (limit = 10) => {
    const ranked = await getRankedContributionImpact();
    return ranked.slice(0, limit).map(r => ({ name: r.name, amount: r.amount }));
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

