"use server";

import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendContactPersonDetails, sendDigitalCardDetails } from "./emails";
import { getBaseUrl } from "../server-utils";


export async function createUserRecord({
    email,
    fullName,
    roles,
    eventId,
    classYear,
}: {
    email: string;
    fullName: string;
    roles: string[];
    eventId: string;
    classYear?: string;
}) {
    try {
        const supabaseAdmin = createAdminClient();
        
        // 0. Pre-check: Does this email already have an institutional profile?
        const existingProfile = await prisma.profile.findUnique({ where: { email } });
        if (existingProfile) {
            return { 
                success: false, 
                error: `An institutional record already exists for ${email}. To avoid duplicate identity records, please use the update feature instead.` 
            };
        }

        // 1. Check if user exists in Supabase Auth
        const { data: userData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) return { success: false, error: listError.message };
        
        let existingAuthUser = userData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (!existingAuthUser) {
            // Create user with scaffolded password (email)
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: email,
                email_confirm: true,
                user_metadata: { full_name: fullName },
            });

            if (createError) return { success: false, error: createError.message };
            existingAuthUser = newUser.user;
        }

        // 2. Create or Update Profile in Prisma
        const profile = await prisma.profile.upsert({
            where: { email },
            update: {
                fullName,
                roles: { set: roles },
            },
            create: {
                id: existingAuthUser.id, // Match Supabase ID
                email,
                fullName,
                roles,
            },
        });

        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) return { success: false, error: "Reference event not found" };

        const domain = await getBaseUrl();
        const loginLink = `${domain}/auth/welcome?email=${encodeURIComponent(email)}`;

        // 3. Create RSVP or DigitalCard based on roles
        if (roles.includes("rsvp")) {
            const uniqueCode = `RSVP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const contactPerson = await prisma.contactPerson.create({
                data: {
                    eventId,
                    profileId: profile.id,
                    name: fullName,
                    email,
                    classYear,
                    uniqueCode,
                },
            });

            await sendContactPersonDetails({
                email,
                name: fullName,
                uniqueCode: contactPerson.uniqueCode,
                eventTitle: event.title,
                classYear,
                loginLink,
            });
        }

        if (roles.includes("cardholder")) {
            const cardCode = `FJS-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const digitalCard = await prisma.digitalCard.create({
                data: {
                    eventId,
                    profileId: profile.id,
                    holderName: fullName,
                    email,
                    classYear,
                    cardCode,
                },
            });

            await sendDigitalCardDetails({
                email,
                name: fullName,
                cardCode: digitalCard.cardCode,
                eventTitle: event.title,
                classYear,
                loginLink,
            });
        }

        revalidatePath("/dashboard/invite");
        return { success: true };
    } catch (error) {
        console.error("Error in createUserRecord:", error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "An unexpected error occurred while establishing the member record." 
        };
    }
}

export async function updateUserRecord({
    id,
    fullName,
    email,
    classYear,
}: {
    id: string;
    fullName: string;
    email: string;
    classYear?: string;
}) {
    try {
        // Check if email is updated and if it's already taken by another user
        const existing = await prisma.profile.findFirst({
            where: {
                email,
                id: { not: id }
            }
        });

        if (existing) {
            return { 
                success: false, 
                error: "This email identifier is already associated with another institutional record." 
            };
        }

        await prisma.profile.update({
            where: { id },
            data: {
                fullName,
                email,
                classYear,
            }
        });

        revalidatePath("/dashboard/invite");
        return { success: true };
    } catch (error) {
        console.error("Error in updateUserRecord:", error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "An unexpected error occurred while refining the identity record." 
        };
    }
}

export async function toggleUserStatus(id: string, isActive: boolean) {
    try {
        await prisma.profile.update({
            where: { id },
            data: { isActive }
        });
        
        revalidatePath("/dashboard/invite");
        return { success: true };
    } catch (error) {
        console.error("Error in toggleUserStatus:", error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "An unexpected error occurred while toggling the member status." 
        };
    }
}

// Keep inviteUser as alias for compatibility if needed, but we'll switch to createUserRecord
export const inviteUser = createUserRecord;
