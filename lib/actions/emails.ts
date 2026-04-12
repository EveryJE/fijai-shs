"use server";

import { render } from "@react-email/render";
import { sendMail } from "@/lib/mail";
import DigitalCardEmail from "@/emails/digital-card";
import ContactPersonEmail from "@/emails/contact-person";
import { getBaseUrl } from "../server-utils";


/**
 * Send a digital card holder their card details + login link.
 */
export async function sendDigitalCardDetails(card: {
    name: string;
    email: string;
    cardCode: string;
    eventTitle: string;
    classYear?: string;
    loginLink?: string;
}) {
    const baseUrl = await getBaseUrl();
    const cardLink = `${baseUrl}/donate/${card.cardCode}`;
    const loginLink = card.loginLink || `${baseUrl}/auth/welcome?email=${encodeURIComponent(card.email)}`;


    const html = await render(
        DigitalCardEmail({
            holderName: card.name,
            cardCode: card.cardCode,
            eventTitle: card.eventTitle,
            classYear: card.classYear,
            email: card.email,
            cardLink,
            loginLink,
        })
    );

    await sendMail({
        to: card.email,
        subject: `Institutional Identity: Your Digital Card for ${card.eventTitle}`,
        //@ts-ignore
        html,
    });
}

/**
 * Send a contact person their details + login link.
 */
export async function sendContactPersonDetails(contact: {
    name: string;
    email: string;
    uniqueCode: string;
    eventTitle: string;
    classYear?: string;
    loginLink?: string;
}) {
    const baseUrl = await getBaseUrl();
    const profileLink = `${baseUrl}/donate/${contact.uniqueCode}`;
    const loginLink = contact.loginLink || `${baseUrl}/auth/welcome?email=${encodeURIComponent(contact.email)}`;


    const html = await render(
        ContactPersonEmail({
            name: contact.name,
            uniqueCode: contact.uniqueCode,
            eventTitle: contact.eventTitle,
            classYear: contact.classYear,
            email: contact.email,
            profileLink,
            loginLink,
        })
    );

    await sendMail({
        to: contact.email,
        subject: `Institutional Role: Contact Person for ${contact.eventTitle}`,
        //@ts-ignore
        html,
    });
}
