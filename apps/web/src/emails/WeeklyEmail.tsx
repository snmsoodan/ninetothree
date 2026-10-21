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
import type { WeeklyEmail as WeeklyEmailModel } from "@/lib/email";

/**
 * The weekly email, as HTML.
 *
 * No images, no tracking pixel, no logo. A parent reading this at 6am on a
 * phone should see words, not a newsletter. The unsubscribe link is visible in
 * the body rather than buried in a grey footer, because a link you have to hunt
 * for is not one click.
 */

const ink = "#1f2421";
const inkSoft = "#4a534d";
const inkFaint = "#6b746e";
const paper = "#fbfaf7";
const rule = "#e2ded4";
const clay = "#8a4b32";

const body: React.CSSProperties = {
  backgroundColor: paper,
  color: ink,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: "16px",
  lineHeight: "1.6",
  margin: 0,
  padding: "32px 16px",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  maxWidth: "560px",
};

const weekLabel: React.CSSProperties = {
  color: inkFaint,
  fontSize: "13px",
  letterSpacing: "0.04em",
  margin: "0 0 4px",
  textTransform: "uppercase",
};

const heading: React.CSSProperties = {
  color: ink,
  fontSize: "24px",
  fontWeight: 600,
  lineHeight: "1.3",
  margin: "0 0 24px",
};

const actionTitle: React.CSSProperties = {
  color: ink,
  fontSize: "17px",
  fontWeight: 600,
  margin: "0 0 2px",
};

const actionWhy: React.CSSProperties = {
  color: inkSoft,
  fontSize: "15px",
  margin: "0 0 6px",
};

const link: React.CSSProperties = {
  color: clay,
  fontSize: "15px",
  textDecoration: "underline",
};

const sectionTitle: React.CSSProperties = {
  color: ink,
  fontSize: "15px",
  fontWeight: 600,
  margin: "0 0 4px",
};

const sectionBody: React.CSSProperties = {
  color: inkSoft,
  fontSize: "15px",
  margin: "0 0 6px",
};

const footer: React.CSSProperties = {
  color: inkFaint,
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0 0 8px",
};

export function WeeklyEmail({ email }: { email: WeeklyEmailModel }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{email.preheader}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={weekLabel}>{email.weekLabel}</Text>
          <Heading as="h1" style={heading}>
            {email.subject}
          </Heading>

          {email.actions.map((action) => (
            <Section key={action.id} style={{ marginBottom: "20px" }}>
              <Text style={actionTitle}>{action.title}</Text>
              <Text style={actionWhy}>{action.why}</Text>
              <Link href={action.url} style={link}>
                Open this week
              </Link>
            </Section>
          ))}

          <Hr style={{ borderColor: rule, margin: "28px 0" }} />

          <Section style={{ marginBottom: "20px" }}>
            <Text style={sectionTitle}>{email.partner.title}</Text>
            <Text style={sectionBody}>{email.partner.body}</Text>
            <Link href={email.partner.url} style={link}>
              Send them this week
            </Link>
          </Section>

          {email.redFlag ? (
            <Section
              style={{
                borderLeft: `2px solid ${clay}`,
                marginBottom: "20px",
                paddingLeft: "12px",
              }}
            >
              <Text style={sectionTitle}>{email.redFlag.title}</Text>
              <Text style={sectionBody}>{email.redFlag.body}</Text>
              <Link href={email.redFlag.url} style={link}>
                What to do
              </Link>
            </Section>
          ) : null}

          <Hr style={{ borderColor: rule, margin: "28px 0" }} />

          <Text style={footer}>
            You get this because you asked for it.{" "}
            <Link href={email.unsubscribeUrl} style={link}>
              Turn it off
            </Link>{" "}
            — one click, no questions.
          </Text>
          <Text style={footer}>
            <Link href={email.settingsUrl} style={link}>
              What we send you
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WeeklyEmail;
