/**
 * Airtable "Satış Takip" base: the sales team's own lead table. The site
 * writes its applicants there (one row per person) and keeps the stage in
 * step with the panel. Names below must match Airtable exactly (field names
 * and single-select options); /admin/durum → "Airtable'ı test et" checks them.
 *
 * The token and base id are environment variables (AIRTABLE_TOKEN,
 * AIRTABLE_BASE_ID); everything here is safe to commit.
 */
export const AIRTABLE = {
  table: "Leadler",
  fields: {
    name: "Ad Soyad",
    channel: "Kanal",
    stage: "Aşama",
    closer: "Satışçı",
    interest: "İlgi",
    instagram: "Instagram Kullanıcı Adı",
    phone: "Telefon",
    email: "E-posta",
    appointment: "Randevu Tarihi",
    lastContact: "Son İletişim",
  },
  /** "Kanal" of every row the site creates. */
  channel: "Site (Calendly)",
  /** Panel status → "Aşama". Disqualified applicants are not written to Airtable. */
  stages: {
    qualified: "Yeni lead",
    booked: "Randevu alındı",
    cancelled: "Yeni lead",
    attended: "Görüşme yapıldı – takipte",
    no_show: "Görüşmeye gelmedi",
    won: "Satış",
    lost: "Satış değil",
  },
  /** Qualification tier → "İlgi", set once when the row is created (the team owns it afterwards). */
  interest: { A: "Sıcak", B: "Ilık", C: "Soğuk" },
} as const;

export type AirtableStageStatus = keyof typeof AIRTABLE.stages;
