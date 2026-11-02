/**
 * Brand identity — every customer-specific name, handle and contact lives
 * here. `sample: true` marks placeholder values; `npm run prelaunch`
 * refuses to pass while any remain.
 */

export const BRAND = {
  /** Company name, address, MERSİS, e-mail, WhatsApp and Instagram are still placeholders. */
  sample: true,
  name: "Ecom Plus Academy",
  legalName: "Şirket Ünvanı Ltd. Şti.",
  tagline: "E-ticaret & dropshipping mentorluk programı",
  founder: {
    name: "Onur Yeşil",
    title: "Kurucu & Baş Mentör",
    /** Hero line under the call to action. */
    proof: "500 bin lira borçtan ₺50M+ satışa · 5 yıl",
  },
  contact: {
    email: "destek@markaniz.com",
    whatsapp: "905000000000",
    address: "Şirket adresi, İlçe / İl",
    mersis: "0000000000000000",
  },
  social: {
    instagram: "https://instagram.com/markaniz",
  },
  /** Call wording used on the thank-you page, in WhatsApp messages and Meta events. */
  callName: "Ücretsiz Strateji Görüşmesi",
} as const;
