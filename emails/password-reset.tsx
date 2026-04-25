import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Row,
    Column,
} from "@react-email/components";
import * as React from "react";

interface PasswordResetEmailProps {
    fullName: string;
    token: string;
    email: string;
}

export const PasswordResetEmail = ({
    fullName,
    token,
    email,
}: PasswordResetEmailProps) => {
    const baseUrl = "https://fosa96.vercel.app";
    const verifyUrl = `${baseUrl}/auth/forgot-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

    return (
        <Html>
            <Head />
            <Preview>Reset your password</Preview>
            <Body style={main}>
                <Section style={mainTable}>
                    <Container style={container}>
                        {/* Pan-African Stripe */}
                        <Section style={{ width: "100%", height: "6px" }}>
                            <Row>
                                <Column style={{ backgroundColor: "#730303", height: "6px" }} />
                                <Column style={{ backgroundColor: "#DAA520", height: "6px" }} />
                                <Column style={{ backgroundColor: "#730303", height: "6px" }} />
                            </Row>
                        </Section>

                        <Section style={logoSection}>
                            <Img
                                src="https://fijai-shs.vercel.app/logo.png"
                                alt="Logo"
                                width="80"
                                height="80"
                                style={logo}
                            />
                        </Section>

                        <Section style={contentSection}>
                            <Heading style={h1}>Reset Password</Heading>
                            <Text style={text}>
                                Hi <strong>{fullName}</strong>,
                            </Text>
                            <Text style={text}>
                                Tap the button below to verify your identity and continue with your password reset:
                            </Text>

                            <Section style={buttonContainer}>
                                <Link href={verifyUrl} style={button}>
                                    Reset Password
                                </Link>
                            </Section>

                            <Text style={subText}>
                                Or use this verification code:
                            </Text>

                            <Section style={otpContainer}>
                                <Text style={otpText}>{token}</Text>
                            </Section>

                            <Text style={footerNote}>
                                ⚠️ Expires in 10 minutes. If you didn't request this, you can safely ignore this email.
                            </Text>
                        </Section>

                        <Section style={footer}>
                            <Text style={copyrightText}>
                                © 2026 Fijai SHS Alumni.
                            </Text>
                        </Section>
                    </Container>
                </Section>
            </Body>
        </Html>
    );
};

export default PasswordResetEmail;

const main = {
    backgroundColor: "#f6f9fc",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const mainTable = {
    padding: "40px 0",
};

const container = {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    overflow: "hidden" as const,
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    maxWidth: "480px",
    margin: "0 auto",
};

const logoSection = {
    padding: "32px 32px 16px",
    textAlign: "center" as const,
};

const logo = {
    display: "block",
    margin: "0 auto",
};

const contentSection = {
    padding: "0 40px 40px",
    textAlign: "center" as const,
};

const h1 = {
    color: "#1a1a1a",
    margin: "0 0 24px",
    fontSize: "24px",
    fontWeight: "700",
};

const text = {
    color: "#4a5568",
    fontSize: "15px",
    lineHeight: "1.5",
    margin: "0 0 16px",
};

const subText = {
    color: "#718096",
    fontSize: "13px",
    margin: "32px 0 8px",
};

const buttonContainer = {
    margin: "24px 0",
};

const button = {
    backgroundColor: "#730303",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "14px 28px",
};

const otpContainer = {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "16px",
    margin: "0 0 32px",
};

const otpText = {
    fontSize: "32px",
    fontWeight: "700",
    letterSpacing: "6px",
    color: "#1a1a1a",
    margin: "0",
    fontFamily: '"Courier New", monospace',
};

const footerNote = {
    color: "#a0aec0",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0",
};

const footer = {
    padding: "24px 40px",
    backgroundColor: "#f8fafc",
    textAlign: "center" as const,
};

const copyrightText = {
    color: "#cbd5e0",
    fontSize: "11px",
    margin: "0",
};
