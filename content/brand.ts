/**
 * Brand identity — every customer-specific name, handle and contact lives
 * here. `sample: true` marks placeholder values; `npm run prelaunch`
 * refuses to pass while any remain.
 */

export const BRAND = {
  sample: true,
  name: "Ecom Plus Academy",
  legalName: "Şirket Ünvanı Ltd. Şti.",
  tagline: "E-ticaret & dropshipping mentorluk programı",
  founder: {
    name: "Kurucu Adı Soyadı",
    title: "Kurucu & baş mentor",
  },
  contact: {
    email: "destek@markaniz.com",
    whatsapp: "905000000000",
    address: "Şirket adresi, İlçe / İl",
    mersis: "0000000000000000",
  },
  social: {
    instagram: "https://instagram.com/markaniz",
    youtube: "https://youtube.com/@markaniz",
    telegram: "https://t.me/markaniz",
    whatsappCommunity: "https://chat.whatsapp.com/ornek-topluluk",
  },
  /** Call wording used on the thank-you page, in WhatsApp messages and Meta events. */
  callName: "Ücretsiz Strateji Görüşmesi",
} as const;
