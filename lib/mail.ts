import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;

if (!smtpHost) {
  console.warn("⚠️ SMTP_HOST is not defined in environment variables. Email delivery will fail.");
}

const transporter = nodemailer.createTransport({
    host: smtpHost,
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
    if (!smtpHost) {
        throw new Error("SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your production environment variables.");
    }
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
