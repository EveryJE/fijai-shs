import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true, // port 465 uses TLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface SendMailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendMail({ to, subject, html, text }: SendMailOptions) {
    const fromName = process.env.SMTP_FROM_NAME || "Fijai SHS Alumni";
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    return transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
    });
}
