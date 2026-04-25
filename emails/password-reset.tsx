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
    const baseUrl = "https://fosa96.vercel.app"; // This should ideally be dynamic
    const verifyUrl = `${baseUrl}/auth/forgot-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

    return (
        <Html>
            <Head />
            <Preview>Reset your Fijai SHS Alumni password</Preview>
            <Body style={main}>
                <Section style={mainTable}>
                    <Container style={container}>
                        {/* Pan-African Stripe */}
                        <Section style={{ width: "100%", height: "6px" }}>
                            <Row>
                                <Column style={{ backgroundColor: "#c41e3a", height: "6px" }} />
                                <Column style={{ backgroundColor: "#ffb800", height: "6px" }} />
                                <Column style={{ backgroundColor: "#228b22", height: "6px" }} />
                            </Row>
                        </Section>

                        {/* Logo Section */}
                        <Section style={logoSection}>
                            <Img
                                src="https://fijai-shs.vercel.app/logo.png"
                                alt="Fijai SHS Logo"
                                width="100"
                                height="100"
                                style={logo}
                            />
                        </Section>

                        {/* Content Section */}
                        <Section style={contentSection}>
                            <Heading style={h1}>Reset Your Password 🔐</Heading>
                            <Text style={text}>
                                Hi <strong>{fullName}</strong>,
                            </Text>
                            <Text style={text}>
                                We received a request to reset your password for your Fijai SHS Alumni account. Click the button below to verify automatically:
                            </Text>

                            {/* Magic Link Button */}
                            <Section style={buttonContainer}>
                                <Link href={verifyUrl} style={button}>
                                    Verify Automatically
                                </Link>
                            </Section>

                            <Text style={{ ...text, textAlign: "center" as const, marginTop: "32px" }}>
                                Or enter this code manually on the reset page:
                            </Text>

                            {/* OTP Code Display */}
                            <Section style={otpContainer}>
                                <Text style={otpText}>{token}</Text>
                            </Section>

                            {/* Security Notice */}
                            <Section style={securityNotice}>
                                <Text style={securityText}>
                                    ⚠️ This code expires in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
                                </Text>
                            </Section>

                            <Section style={divider} />

                            <Text style={footerText}>
                                Choosing a strong password helps keep your account secure.
                            </Text>

                            {/* Security Tips */}
                            <Section style={securityTips}>
                                <Text style={tipsTitle}>🛡️ Security Tips:</Text>
                                <ul style={tipsList}>
                                    <li>Choose a strong, unique password</li>
                                    <li>Never share your password with anyone</li>
                                    <li>Consider using a password manager</li>
                                </ul>
                            </Section>
                        </Section>

                        {/* Footer Stripe */}
                        <Section style={{ width: "100%", height: "4px" }}>
                            <Row>
                                <Column style={{ backgroundColor: "#c41e3a", height: "4px" }} />
                                <Column style={{ backgroundColor: "#ffb800", height: "4px" }} />
                                <Column style={{ backgroundColor: "#228b22", height: "4px" }} />
                            </Row>
                        </Section>

                        {/* Footer Section */}
                        <Section style={footer}>
                            <Text style={footerSubText}>
                                Didn't request a password reset? You can safely ignore this email. Your password will remain unchanged.
                            </Text>
                            <Text style={copyrightText}>
                                © 2026 Fijai SHS Alumni Association. All rights reserved.
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
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
    maxWidth: "600px",
    margin: "0 auto",
};

const logoSection = {
    padding: "48px 48px 32px",
    textAlign: "center" as const,
};

const logo = {
    display: "block",
    margin: "0 auto",
};

const contentSection = {
    padding: "20px 48px 40px",
};

const h1 = {
    color: "#1a1a1a",
    margin: "0 0 16px",
    fontSize: "28px",
    fontWeight: "700",
    lineHeight: "1.3",
};

const text = {
    color: "#4a5568",
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "0 0 12px",
};

const buttonContainer = {
    textAlign: "center" as const,
    margin: "32px 0",
};

const button = {
    backgroundColor: "#730303",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "16px 32px",
};

const otpContainer = {
    backgroundColor: "#fffbeb",
    border: "2px dashed #ffb800",
    borderRadius: "12px",
    padding: "24px",
    margin: "16px 0 32px",
    textAlign: "center" as const,
};

const otpText = {
    fontSize: "36px",
    fontWeight: "700",
    letterSpacing: "8px",
    color: "#1a1a1a",
    margin: "0",
    fontFamily: '"Courier New", monospace',
};

const securityNotice = {
    backgroundColor: "#fef2f2",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
};

const securityText = {
    color: "#991b1b",
    fontSize: "14px",
    lineHeight: "1.5",
    margin: "0",
};

const divider = {
    borderTop: "1px solid #e2e8f0",
    margin: "32px 0",
};

const footerText = {
    color: "#718096",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0",
    textAlign: "center" as const,
};

const securityTips = {
    marginTop: "32px",
    backgroundColor: "#f7fafc",
    borderRadius: "8px",
    padding: "20px",
};

const tipsTitle = {
    color: "#4a5568",
    fontSize: "14px",
    fontWeight: "600",
    margin: "0 0 12px",
};

const tipsList = {
    color: "#718096",
    fontSize: "13px",
    lineHeight: "1.8",
    margin: "0",
    paddingLeft: "20px",
};

const footer = {
    padding: "32px 48px",
    backgroundColor: "#f7fafc",
};

const footerSubText = {
    color: "#a0aec0",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: "0 0 8px",
};

const copyrightText = {
    color: "#cbd5e0",
    fontSize: "12px",
    margin: "0",
};
