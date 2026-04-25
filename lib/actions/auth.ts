"use server";


import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sendContactPersonDetails, sendDigitalCardDetails, sendPasswordResetEmail } from "./emails";
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
    const normalizedEmail = email.toLowerCase();
    try {
        const supabaseAdmin = createAdminClient();
        
        // 0. Pre-check: Does this email already have an institutional profile?
        const existingProfile = await prisma.profile.findUnique({ where: { email: normalizedEmail } });
        if (existingProfile) {
            return { 
                success: false, 
                error: `An institutional record already exists for ${normalizedEmail}. To avoid duplicate identity records, please use the update feature instead.` 
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
            where: { email: normalizedEmail },
            update: {
                fullName,
                roles: { set: roles },
                classYear,
            },
            create: {
                id: existingAuthUser.id, // Match Supabase ID
                email: normalizedEmail,
                fullName,
                roles,
                classYear,
            },
        });

        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) return { success: false, error: "Reference event not found" };

        const domain = await getBaseUrl();
        const loginLink = `${domain}/auth/welcome?email=${encodeURIComponent(normalizedEmail)}`;

        // 3. Create RSVP or DigitalCard based on roles
        if (roles.includes("rsvp")) {
            const uniqueCode = `RSVP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const contactPerson = await prisma.contactPerson.create({
                data: {
                    eventId,
                    profileId: profile.id,
                    name: fullName,
                    email: normalizedEmail,
                    classYear,
                    uniqueCode,
                },
            });

            await sendContactPersonDetails({
                email: normalizedEmail,
                name: fullName,
                uniqueCode: contactPerson.uniqueCode,
                eventTitle: event.title,
                classYear,
                loginLink,
            });
        }

        if (roles.includes("cardholder") || roles.includes("rsvp") || roles.includes("admin")) {
            const cardCode = `FJS-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const digitalCard = await prisma.digitalCard.create({
                data: {
                    eventId,
                    profileId: profile.id,
                    holderName: fullName,
                    email: normalizedEmail,
                    classYear,
                    cardCode,
                },
            });

            await sendDigitalCardDetails({
                email: normalizedEmail,
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
    roles,
    classYear,
}: {
    id: string;
    fullName: string;
    email: string;
    roles?: string[];
    classYear?: string;
}) {
    const normalizedEmail = email.toLowerCase();
    try {
        // Check if email is updated and if it's already taken by another user
        const existing = await prisma.profile.findFirst({
            where: {
                email: normalizedEmail,
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
                email: normalizedEmail,
                classYear,
                ...(roles ? { roles: { set: roles } } : {}),
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

export async function resendInvitationEmail(profileId: string) {
    try {
        const profile = await prisma.profile.findUnique({
            where: { id: profileId },
            include: {
                contactPersons: {
                    include: { event: true },
                    take: 1,
                    orderBy: { createdAt: "desc" }
                },
                digitalCards: {
                    include: { event: true },
                    take: 1,
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        if (!profile) return { success: false, error: "Member profile not found." };
        if (!profile.email) return { success: false, error: "Member does not have an associated email address." };

        const domain = await getBaseUrl();
        const loginLink = `${domain}/auth/welcome?email=${encodeURIComponent(profile.email)}`;
        let emailsSent = 0;

        // Resend RSVP/Contact Person details if applicable
        if (profile.roles.includes("rsvp") && profile.contactPersons.length > 0) {
            const contact = profile.contactPersons[0];
            await sendContactPersonDetails({
                email: profile.email,
                name: profile.fullName || "Member",
                uniqueCode: contact.uniqueCode,
                eventTitle: contact.event.title,
                classYear: contact.classYear || undefined,
                loginLink,
            });
            emailsSent++;
        }

        // Resend Digital Card details if applicable
        if (profile.roles.includes("cardholder") && profile.digitalCards.length > 0) {
            const card = profile.digitalCards[0];
            await sendDigitalCardDetails({
                email: profile.email,
                name: profile.fullName || "Member",
                cardCode: card.cardCode,
                eventTitle: card.event.title,
                classYear: card.classYear || undefined,
                loginLink,
            });
            emailsSent++;
        }

        if (emailsSent === 0) {
            return { success: false, error: "No active RSVP or Digital Card records found to resend." };
        }

        return { success: true };
    } catch (error) {
        console.error("Error in resendInvitationEmail:", error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "An unexpected error occurred while resending the invitation." 
        };
    }
}

export async function sendPasswordResetAction(email: string) {
    try {
        const normalizedEmail = email.toLowerCase();
        const profile = await prisma.profile.findUnique({
            where: { email: normalizedEmail }
        });

        if (!profile) {
            return { success: true }; 
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
        // Save OTP to database
        await prisma.passwordResetToken.create({
            data: {
                email: normalizedEmail,
                token: otp,
                expiresAt,
            }
        });

        // Send email
        await sendPasswordResetEmail({
            email: normalizedEmail,
            fullName: profile.fullName || "Member",
            token: otp,
        });
        
        return { success: true };
    } catch (error) {
        console.error("Error in sendPasswordResetAction:", error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "An unexpected error occurred while sending the recovery code." 
        };
    }
}

export async function verifyPasswordResetOTP(email: string, otp: string) {
    try {
        const normalizedEmail = email.toLowerCase();
        const resetToken = await prisma.passwordResetToken.findFirst({
            where: {
                email: normalizedEmail,
                token: otp,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: "desc" }
        });

        if (!resetToken) {
            return { success: false, error: "Invalid or expired recovery code." };
        }

        return { success: true };
    } catch (error) {
        console.error("Error in verifyPasswordResetOTP:", error);
        return { success: false, error: "Verification failed." };
    }
}

export async function resetPasswordWithOTP({
    email,
    otp,
    newPassword
}: {
    email: string;
    otp: string;
    newPassword: string;
}) {
    try {
        const normalizedEmail = email.toLowerCase();
        
        // 1. Verify OTP again for security
        const resetToken = await prisma.passwordResetToken.findFirst({
            where: {
                email: normalizedEmail,
                token: otp,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: "desc" }
        });

        if (!resetToken) {
            return { success: false, error: "Invalid or expired session. Please start over." };
        }

        // 2. Find Profile to get ID
        const profile = await prisma.profile.findUnique({
            where: { email: normalizedEmail }
        });

        if (!profile) return { success: false, error: "Account not found." };

        // 3. Update password in Supabase Auth via Admin
        const supabaseAdmin = createAdminClient();
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            profile.id,
            { password: newPassword }
        );

        if (updateError) return { success: false, error: updateError.message };

        // 4. Delete the token so it can't be used again
        await prisma.passwordResetToken.delete({
            where: { id: resetToken.id }
        });

        // 5. Automatically authorize the user (sign in)
        const supabase = await createClient();
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: newPassword,
        });

        if (loginError) {
            console.error("Auth error after reset:", loginError);
            // We still return success: true because the password WAS reset, 
            // but the user might need to log in manually if auto-login fails.
            return { success: true, autoLoginFailed: true };
        }

        return { success: true };
    } catch (error) {
        console.error("Error in resetPasswordWithOTP:", error);
        return { success: false, error: "Failed to reset password." };
    }
}

// Keep inviteUser as alias for compatibility if needed, but we'll switch to createUserRecord
export const inviteUser = createUserRecord;
