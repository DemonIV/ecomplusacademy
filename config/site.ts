import { BRAND } from "@/content/brand";

/**
 * Business settings the client changes without touching components.
 *
 * EVERY MONTH: set `cohort.month` to the new period's month. The hero pill,
 * the capacity box, the coach card and the thank-you page all read it.
 * `seats` and `taken` must be REAL numbers: the page never shows an
 * invented countdown, and "N yer kaldı" appears only once someone joined.
 */
export const COHORT = {
  /** Seat count to be confirmed by Onur ("[10]" in the brief). */
  sample: true,
  month: "Kasım",
  seats: 10,
  taken: 0,
} as const;

export const SITE = {
  cohortLabel: `${COHORT.month} dönemi için başvurular açık`,
  /** /sonuc (applicants who are not a fit right now). */
  result: {
    instagram: {
      title: "Instagram'da takip et",
      text: "Ürün araştırma, reklam ve stok üzerine kısa videolar. Sorunu DM'den yazabilirsin.",
      href: BRAND.social.instagram,
      cta: "Takip et",
    },
    /** "İlk 30 Gün Planı" PDF: the card appears once `href` is set (a file in public/ or a full URL). */
    thirtyDayPlan: {
      sample: true,
      title: "İlk 30 Gün Planı",
      text: "Ürün seçiminden ilk teste kadar, ilk ayını gün gün planlayan ücretsiz rehber.",
      href: null as string | null,
      cta: "PDF'i indir",
    },
  },
  reapplyDays: 30,
  /** Footer copyright year (a literal, so pages stay fully static). */
  copyrightYear: 2026,
} as const;
