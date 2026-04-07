"use server";

import { render } from "@react-email/render";
import { sendMail } from "@/lib/mail";
import DigitalCardEmail from "@/emails/digital-card";
import ContactPersonEmail from "@/emails/contact-person";

const BASE_URL = process.env.NEXT_PUBLIC_DOMAIN_URL || "http://localhost:3000";

/**
 * Send a digital card holder their card details + login link.
 */
export async function sendDigitalCardEmail(card: {
    holderName: string;
    email: string;
    cardCode: string;
    eventTitle: string;
}) {
    const cardLink = `${BASE_URL}/card/${card.cardCode}`;
    const loginLink = `${BASE_URL}/auth/login`;

    const html = await render(
        DigitalCardEmail({
            holderName: card.holderName,
            cardCode: card.cardCode,
            eventTitle: card.eventTitle,
            cardLink,
            loginLink,
        })
    );

    await sendMail({
        to: card.email,
        subject: `Your Digital Card for ${card.eventTitle}`,
        html,
    });
}

/**
 * Send a contact person their details + login link.
 */
export async function sendContactPersonEmail(contact: {
    name: string;
    email: string;
    uniqueCode: string;
    eventTitle: string;
    classYear?: string | null;
}) {
    const profileLink = `${BASE_URL}/contact/${contact.uniqueCode}`;
    const loginLink = `${BASE_URL}/auth/login`;

    const html = await render(
        ContactPersonEmail({
            name: contact.name,
            uniqueCode: contact.uniqueCode,
            eventTitle: contact.eventTitle,
            classYear: contact.classYear,
            profileLink,
            loginLink,
        })
    );

    await sendMail({
        to: contact.email,
        subject: `You're a Contact Person for ${contact.eventTitle}`,
        html,
    });
}
