import { prisma } from "@/lib/prisma";

export async function getOrganization() {
  const org = await prisma.organization.findFirst();
  if (!org) {
    // Return a default if none exists yet
    return {
      id: "singleton-org",
      name: "Fijai SHS",
      primaryColor: "#730303",
      secondaryColor: "#DAA520",
      logoUrl: null,
    };
  }
  return org;
}
