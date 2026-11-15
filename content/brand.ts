/**
 * Brand identity — every customer-specific name, handle and contact lives
 * here. `sample: true` marks placeholder values; `npm run prelaunch`
 * refuses to pass while any remain.
 */

export const BRAND = {
  /** Company name, address and MERSİS are still placeholders; the WhatsApp line is not set yet. */
  sample: true,
  name: "Ecom Plus Academy",
  legalName: "Şirket Ünvanı Ltd. Şti.",
  /**
   * Set to true once `legalName`, `contact.address` and `contact.mersis` are
   * the real ones. Until then the footer and the legal pages show the brand
   * name only, never the placeholders.
   */
  legalReady: false,
  tagline: "E-ticaret & dropshipping mentorluk programı",
  /** Head mentor: runs the training and looks after the students. */
  mentor: {
    name: "Tarık Buğra Varol",
    title: "Baş Mentör",
    /** Hero line under the call to action; also the thank-you page. */
    proof: "yüzlerce başarılı öğrenci, ₺115M ekip cirosu",
  },
  /** Founder: the face of the academy, takes the free calls and stays with the students. */
  founder: {
    name: "Onur Yeşil",
    title: "Kurucu",
    proof: "5 yıldır e-ticarette, kendi mağazalarında ₺50M+ satış",
  },
  contact: {
    email: "onur@ecomplusacademy.com",
    /**
     * Digits with country code ("905321234567"). Empty until the academy's
     * WhatsApp Business line exists: every WhatsApp link and button on the
     * site stays hidden while it is empty.
     */
    whatsapp: "" as string,
    address: "Şirket adresi, İlçe / İl",
    mersis: "0000000000000000",
  },
  social: {
    instagram: "https://instagram.com/onryesll",
  },
  /** Call wording used on the thank-you page, in WhatsApp messages and Meta events. */
  callName: "Ücretsiz Strateji Görüşmesi",
} as const;
