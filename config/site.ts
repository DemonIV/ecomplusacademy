import { BRAND } from "@/content/brand";

/**
 * Business settings the client changes without touching components.
 * Update `capacity` with REAL numbers each period — the page never shows
 * an invented countdown.
 */
export const SITE = {
  cohortLabel: "Kasım dönemi için başvurular açık",
  capacity: {
    sample: true,
    label: "Kasım dönemi kontenjanı",
    total: 20,
    taken: 14,
  },
  /** Shown to applicants who are not a fit right now (/sonuc). */
  freeResources: [
    {
      title: "Ücretsiz YouTube eğitimleri",
      text: "Ürün araştırmadan ilk reklama kadar temel serimiz.",
      href: BRAND.social.youtube,
      cta: "Videoları izle",
    },
    {
      title: "Instagram'da haftalık ipuçları",
      text: "Kısa videolar ve canlı yayın kayıtları.",
      href: BRAND.social.instagram,
      cta: "Profili aç",
    },
    {
      title: "Ücretsiz topluluk",
      text: "Sorularını sorabileceğin WhatsApp topluluğumuz.",
      href: BRAND.social.whatsappCommunity,
      cta: "Topluluğa katıl",
    },
  ],
  reapplyDays: 30,
  /** Footer copyright year (a literal, so pages stay fully static). */
  copyrightYear: 2026,
} as const;
