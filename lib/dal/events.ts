import { prisma } from "@/lib/prisma";
import { cache } from "react";

export async function getAllEvents() {
    return prisma.event.findMany({
        orderBy: { createdAt: "desc" },
    });
}

export async function getActiveEvents() {
    return prisma.event.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
    });
}

export async function getEventById(id: string) {
    return prisma.event.findUnique({
        where: { id },
    });
}

export const getEventWithCategories = cache(async (eventId: string) => {
    return prisma.event.findUnique({
        where: { id: eventId },
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
    });
});
