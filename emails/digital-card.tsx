import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from "@react-email/components";

interface DigitalCardEmailProps {
    holderName: string;
    email: string;
    cardCode: string;
    eventTitle: string;
    cardLink: string;
    loginLink: string;
    classYear?: string;
}

export default function DigitalCardEmail({
    holderName = "John Doe",
    email = "alumni@example.com",
    cardCode = "CARD-ABC123",
    eventTitle = "2026 School Project",
    cardLink = "http://localhost:3000/card/CARD-ABC123",
    loginLink = "http://localhost:3000/auth/login",
    classYear,
}: DigitalCardEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Your Digital Card for {eventTitle}</Preview>
            <Body style={body}>
                <Container style={container}>
                    <Section style={header}>
                        <Img
                            src="https://wgitknkazyorrhqbpnub.supabase.co/storage/v1/object/public/profile/Fijai_Senior_High_School.png"
                            width="60"
                            height="60"
                            alt="Fijai SHS Logo"
                            style={logo}
                        />
                        <Heading style={headerTitle}>Fijai SHS Alumni</Heading>
                        <Text style={headerSubtitle}>{eventTitle}</Text>
                    </Section>

                    <Section style={content}>
                        <Text style={greeting}>
                            Hello <strong>{holderName}</strong>,
                        </Text>
                        <Text style={paragraph}>
                            You have been issued a{" "}
                            <strong>Digital Fundraising Card</strong> for the{" "}
                            <strong>{eventTitle}</strong>. Share your card with
                            friends and family to help drive donations for the
                            school.
                        </Text>

                        <Section style={codeBox}>
                            <Text style={codeLabel}>Your Card Code</Text>
                            <Text style={codeValue}>{cardCode}</Text>
                        </Section>

                        <Section style={buttonContainer}>
                            <Link href={cardLink} style={button}>
                                View Your Donation Page
                            </Link>
                        </Section>

                        <Text style={paragraph}>
                            <strong>How to track your impact:</strong>
                            <br />
                            Your account is ready. You can log in to the dashboard to see all contributions linked to your card.
                        </Text>

                        <Section style={credentialBox}>
                            <Text style={credentialText}>
                                <strong>Platform Login:</strong> {loginLink}
                                <br />
                                <strong>Official Identifier:</strong> {email}
                                <br />
                                <strong>Temporary Password:</strong> Use your <u>email address</u> to log in for the first time.
                            </Text>
                        </Section>

                        <Text style={smallText}>
                            Once logged in, you can update your profile, track milestones, and change your password for security.
                        </Text>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerBrand}>
                            Fijai SHS Alumni Fundraising Platform
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

const body = {
    backgroundColor: "#f4f4f4",
    fontFamily: "'Segoe UI', Arial, sans-serif",
};

const container = {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
};

const header = {
    backgroundColor: "#730303",
    padding: "24px",
    textAlign: "center" as const,
};

const headerTitle = {
    color: "#DAA520",
    margin: "0",
    fontSize: "24px",
};

const headerSubtitle = {
    color: "#ffffff",
    margin: "4px 0 0",
    fontSize: "14px",
};

const logo = {
    margin: "0 auto 12px",
};

const content = {
    padding: "32px 24px",
};

const greeting = {
    fontSize: "16px",
    color: "#333",
};

const paragraph = {
    fontSize: "15px",
    color: "#555",
    lineHeight: "1.6",
};

const codeBox = {
    backgroundColor: "#f8f8f8",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "20px",
    margin: "24px 0",
    textAlign: "center" as const,
};

const codeLabel = {
    margin: "0 0 4px",
    fontSize: "13px",
    color: "#888",
};

const codeValue = {
    margin: "0",
    fontSize: "28px",
    fontWeight: "bold" as const,
    color: "#730303",
    letterSpacing: "2px",
};

const credentialBox = {
    backgroundColor: "#f0f0f0",
    border: "1px dashed #730303",
    borderRadius: "8px",
    padding: "16px",
    margin: "20px 0",
};

const credentialText = {
    fontSize: "13px",
    color: "#333",
    margin: "0",
    lineHeight: "1.8",
};

const buttonContainer = {
    textAlign: "center" as const,
    margin: "24px 0",
};

const button = {
    display: "inline-block",
    backgroundColor: "#730303",
    color: "#ffffff",
    padding: "14px 32px",
    textDecoration: "none",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: "600" as const,
};

const smallText = {
    fontSize: "14px",
    color: "#555",
    lineHeight: "1.6",
};

const hr = {
    borderTop: "1px solid #eee",
    margin: "24px 0",
};

const footerText = {
    fontSize: "13px",
    color: "#888",
};

const link = {
    color: "#730303",
};

const footer = {
    backgroundColor: "#f0f0f0",
    padding: "16px 24px",
    textAlign: "center" as const,
};

const footerBrand = {
    fontSize: "12px",
    color: "#999",
    margin: "0",
};
