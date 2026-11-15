/**
 * Airtable "Ecom Plus Academy – Satış Takip" base, table "Leadler": the sales
 * team's own lead list. The site writes two kinds of rows there:
 *  - qualified applicants (stage follows the booking and the panel's result),
 *  - every sales call booked in Calendly, also by people who never applied
 *    (a link the team sent over DM or WhatsApp).
 * One row per person: an existing row with the same Calendly event, e-mail,
 * phone or Instagram handle is updated instead of adding a new one.
 *
 * Names below must match Airtable exactly (field names and single-select
 * options); /admin/durum → "Airtable'ı test et" compares them with the table.
 * Token and base id are environment variables (AIRTABLE_TOKEN, AIRTABLE_BASE_ID);
 * everything here is safe to commit and to import in client components.
 */
export const AIRTABLE = {
  table: "Leadler",
  fields: {
    name: "Ad Soyad",
    stage: "Aşama",
    appointment: "Randevu Tarihi",
    closer: "Satışçı",
    channel: "Kanal",
    interest: "İlgi",
    phone: "Telefon",
    instagram: "Instagram Kullanıcı Adı",
    email: "E-posta",
    lastContact: "Son İletişim",
    saleAmount: "Satış Tutarı",
    saleDate: "Satış Tarihi",
    lostReason: "Kayıp Nedeni",
    notes: "Notlar",
    campaign: "Meta Kampanyası",
    adSet: "Meta Reklam Seti",
    ad: "Meta Reklamı",
    fbclid: "fbclid",
    fbc: "fbc",
    fbp: "fbp",
    utmSource: "UTM Source",
    calendlyEvent: "Calendly Event ID",
  },
  /** "Kanal" of a new row: site applicants, and Calendly bookings by `utm_source` (none → site). */
  channels: {
    site: "Site (Calendly)",
    whatsapp: "WhatsApp",
    instagram: "Instagram DM",
  },
  /** Panel status → "Aşama". */
  stages: {
    qualified: "Yeni lead",
    booked: "Randevu alındı",
    cancelled: "Randevu almadı",
    attended: "Görüşme yapıldı – takipte",
    no_show: "Görüşmeye gelmedi",
    won: "Satış",
    lost: "Satış değil",
  },
  /**
   * Stages the team sets after a call. Bookings and applications never move a
   * row out of them; only a result entered in the panel does.
   */
  decidedStages: ["Görüşme yapıldı – takipte", "Satış", "Satış değil"],
  /** Qualification tier → "İlgi", set when the row is created (the team owns it afterwards). */
  interest: { A: "Sıcak", B: "Ilık", C: "Soğuk" },
  /** "Kayıp Nedeni" options; the panel's outcome form offers the same list. */
  lostReasons: ["Fiyat", "Zamanı yok", "Güvenmedi", "Düşünecek", "Ulaşılamadı", "Uygun değil"],
  /**
   * Calendly event types that are sales calls (the name contains one of these,
   * case-insensitive). Their bookings reach the table even without an
   * application; other event types ("Eğitim Görüşmesi", "30 Minute Meeting")
   * stay out. Add the team's round-robin event here if its name differs.
   */
  salesEvents: ["Ön Görüşme"],
} as const;

export type AirtableStageStatus = keyof typeof AIRTABLE.stages;
