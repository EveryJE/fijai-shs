"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrganization(id: string | null, data: any) {
  let targetId = id;

  if (!targetId) {
    const firstOrg = await prisma.organization.findFirst();
    targetId = firstOrg?.id || "singleton-org";
  }

  await prisma.organization.upsert({
    where: { id: targetId },
    update: {
      name: data.name,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      tertiaryColor: data.tertiaryColor,
      bankCode: data.bankCode,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
    },
    create: {
      id: targetId,
      name: data.name || "Fijai SHS",
      primaryColor: data.primaryColor || "#730303",
      secondaryColor: data.secondaryColor || "#DAA520",
      tertiaryColor: data.tertiaryColor || "#1B3A5C",
    },
  });
  
  revalidatePath("/dashboard");
}
