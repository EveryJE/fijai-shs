import { prisma } from "@/lib/prisma";

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
