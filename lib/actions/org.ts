"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrganization(id: string | null, data: {
  name?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
}) {
  const targetId = id || (await prisma.organization.findFirst())?.id || "singleton-org";

  await prisma.organization.upsert({
    where: { id: targetId },
    update: data,
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

export async function savePayoutAccount(
  organizationId: string,
  bankCode: string,
  bankName: string,
  accountNumber: string,
  accountName: string,
  subaccountCode: string,
  settlementBank: string
) {
  const targetId =
    organizationId ||
    (await prisma.organization.findFirst({ select: { id: true } }))?.id ||
    "singleton-org";

  await prisma.organization.update({
    where: { id: targetId },
    data: {
      bankCode,
      bankName,
      accountNumber,
      accountName,
      subaccountCode,
      settlementBank,
      currency: "GHS",
    },
  });
  
  revalidatePath("/dashboard/organization");
}
