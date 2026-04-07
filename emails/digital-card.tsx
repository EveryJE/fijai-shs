import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from "@react-email/components";

interface DigitalCardEmailProps {
    holderName: string;
    cardCode: string;
    eventTitle: string;
    cardLink: string;
    loginLink: string;
}

export default function DigitalCardEmail({
    holderName = "John Doe",
    cardCode = "CARD-ABC123",
    eventTitle = "2026 School Project",
    cardLink = "http://localhost:3000/card/CARD-ABC123",
    loginLink = "http://localhost:3000/auth/login",
}: DigitalCardEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Your Digital Card for {eventTitle}</Preview>
            <Body style={body}>
                <Container style={container}>
                    <Section style={header}>
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
                                View Your Card
                            </Link>
                        </Section>

                        <Text style={smallText}>
                            When people donate through your card, it will be
                            tracked under your name. You can view your donation
                            progress anytime.
                        </Text>

                        <Hr style={hr} />

                        <Text style={footerText}>
                            Need to check your dashboard?{" "}
                            <Link href={loginLink} style={link}>
                                Log in here
                            </Link>
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
