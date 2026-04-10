"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(id: string, data: any) {
  await prisma.profile.update({
    where: { id },
    data: {
      fullName: data.fullName,
      aliasName: data.aliasName,
      phone: data.phone,
      avatarUrl: data.avatarUrl,
      classYear: data.classYear,
    },
  });
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
}
