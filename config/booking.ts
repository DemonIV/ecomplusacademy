/**
 * Booking settings. Client-safe.
 *
 * Availability, buffers, reminders and double-booking protection live in
 * Calendly. The site's event is Onur's "Ecom Plus Academy | Ücretsiz Ön
 * Görüşme (Onur)" (he takes every sales call for now; a team Round Robin
 * event can replace it when more closers join). Set up as:
 *   - duration 30 minutes, booking window ~5 days (a call close to the ad
 *     click keeps the sale inside Meta's 7-day click window and cuts no-shows)
 *   - location "Zoom": the host connects their Zoom account in Calendly
 *     (Integrations → Zoom); Calendly then creates a meeting per booking and
 *     puts the link in its e-mails, and the panel shows it with the booking
 *   - questions in this order: 1 phone (WhatsApp), 2 Instagram handle, then
 *     anything else; the site fills the first two (`phoneAnswer`, `instagramAnswer`)
 *   - the name contains "Ön Görüşme", so Airtable treats it as a sales call
 */
type CalendlyAnswer = `a${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`;

export const BOOKING = {
  timeZone: "Europe/Istanbul",
  /** Shown in copy only; the real length is the Calendly event's. */
  meetingMinutes: 30,
  calendly: {
    sample: true,
    /** Public link of the Calendly event, e.g. https://calendly.com/ecomplus/strateji-gorusmesi */
    url: "https://calendly.com/ornek-hesap/strateji-gorusmesi",
    /**
     * Calendly custom questions the site fills in ("a1" = first question):
     * the applicant's WhatsApp number and Instagram handle. null = not asked.
     */
    phoneAnswer: "a1" as CalendlyAnswer | null,
    instagramAnswer: "a2" as CalendlyAnswer | null,
    /** Embed colours (hex, no #). Calendly applies them on paid plans only. */
    colors: { background: "131316", text: "f2efe9", primary: "d8b06f" },
  },
};
