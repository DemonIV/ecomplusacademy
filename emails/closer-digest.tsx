import { Button, Heading, Section, Text } from "react-email";
import { EmailLayout, emailColors, headingStyle, textStyle } from "@/emails/layout";

export type DigestCall = { name: string; whenLabel: string; phone: string; url: string };

export function CloserDigestEmail(props: {
  name: string;
  pending: DigestCall[];
  today: DigestCall[];
  adminUrl: string;
}) {
  return (
    <EmailLayout preview={`${props.pending.length} görüşmenin sonucu bekleniyor · bugün ${props.today.length} görüşme`}>
      <Heading as="h1" style={headingStyle}>
        Günaydın {props.name}
      </Heading>
      {props.pending.length > 0 ? (
        <>
          <Text style={textStyle}>
            Aşağıdaki görüşmelerin sonucu henüz işaretlenmedi. Meta, satışları reklamlara ancak sen
            &quot;Geldi / Satış / Kaybedildi&quot; diye işaretlediğinde bağlayabiliyor.
          </Text>
          <CallList calls={props.pending} accent={emailColors.gold} />
        </>
      ) : (
        <Text style={textStyle}>Bekleyen sonuç yok, harika. 👏</Text>
      )}
      <Text style={{ ...textStyle, marginTop: 18, fontWeight: 700, color: emailColors.ink }}>
        Bugünkü görüşmeler ({props.today.length})
      </Text>
      {props.today.length ? (
        <CallList calls={props.today} accent={emailColors.silver} />
      ) : (
        <Text style={textStyle}>Bugün planlanmış görüşme yok.</Text>
      )}
      <Button
        href={props.adminUrl}
        style={{
          backgroundColor: emailColors.ink,
          color: "#ffffff",
          borderRadius: 10,
          padding: "12px 20px",
          fontWeight: 700,
          fontSize: 14,
          textDecoration: "none",
          marginTop: 8,
        }}
      >
        Panele git
      </Button>
    </EmailLayout>
  );
}

function CallList({ calls, accent }: { calls: DigestCall[]; accent: string }) {
  return (
    <Section style={{ margin: "4px 0 12px" }}>
      {calls.map((call) => (
        <Text
          key={call.url}
          style={{
            ...textStyle,
            fontSize: 14,
            margin: "0 0 8px",
            padding: "10px 14px",
            borderLeft: `3px solid ${accent}`,
            backgroundColor: emailColors.surface,
            borderRadius: 8,
          }}
        >
          <a href={call.url} style={{ color: emailColors.ink, fontWeight: 700, textDecoration: "none" }}>
            {call.name}
          </a>
          <br />
          {call.whenLabel} · WhatsApp {call.phone}
        </Text>
      ))}
    </Section>
  );
}
