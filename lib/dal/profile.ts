import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getProfileById = cache(async (id: string) => {
    return prisma.profile.findUnique({ where: { id } });
});

export const getProfileByEmail = cache(async (email: string) => {
    return prisma.profile.findUnique({ where: { email } });
});
