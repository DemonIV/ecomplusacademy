import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { BRAND } from "@/content/brand";
import "./globals.css";

const display = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const sans = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
// Closed to search engines until the real content is in (ALLOW_INDEXING=true, then redeploy).
const indexable = process.env.ALLOW_INDEXING === "true";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  robots: indexable ? undefined : { index: false, follow: false, googleBot: { index: false, follow: false } },
  title: {
    default: `${BRAND.name} · ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Ürün bulmaktan reklam yönetimine kadar e-ticaret markanı birlikte kuruyoruz. Sana uygun olup olmadığını ücretsiz bir görüşmede birlikte netleştirelim.",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: BRAND.name,
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#070708",
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
