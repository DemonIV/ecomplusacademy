import type { ReactNode } from "react";
import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "react-email";
import { BRAND } from "@/content/brand";

/** Light e-mail version of the site palette (graphite, champagne gold, silver). */
export const emailColors = {
  ink: "#111113",
  text: "#2b2926",
  muted: "#6f6a63",
  line: "#e7e2da",
  gold: "#a9823f",
  goldBright: "#d8b06f",
  silver: "#8f8a85",
  surface: "#f6f4f0",
};

export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: emailColors.surface, margin: 0, padding: "24px 0", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 16, overflow: "hidden", border: `1px solid ${emailColors.line}` }}>
          <Section style={{ backgroundColor: emailColors.ink, padding: "22px 32px" }}>
            <Text style={{ margin: 0, color: "#f2efe9", fontSize: 18, fontWeight: 700, letterSpacing: 0.4 }}>
              {BRAND.name}
              <span style={{ color: emailColors.goldBright, fontSize: 13, fontWeight: 600, marginLeft: 10 }}>Ekip</span>
            </Text>
          </Section>
          <Section style={{ padding: "28px 32px 8px" }}>{children}</Section>
          <Hr style={{ borderColor: emailColors.line, margin: "16px 32px" }} />
          <Section style={{ padding: "0 32px 28px" }}>
            <Text style={{ margin: 0, color: emailColors.muted, fontSize: 12, lineHeight: "18px" }}>
              Bu e-posta {BRAND.name} ekip panelinden, görüşme yapan ekip üyelerine gönderilir. Almak istemiyorsan
              yöneticinden panelde &quot;Görüşme yapıyor&quot; işaretini kaldırmasını iste.
              <br />
              {BRAND.legalName}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const textStyle = { color: emailColors.text, fontSize: 15, lineHeight: "24px", margin: "0 0 14px" };
export const headingStyle = { color: emailColors.ink, fontSize: 22, lineHeight: "30px", margin: "0 0 12px", fontWeight: 700 };
